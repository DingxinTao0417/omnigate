package perfmetrics

import (
	"sort"
	"sync"
	"sync/atomic"
	"time"
)

// liveSampleCapacity bounds the in-memory ring buffer used to render the
// "recent requests" strip. Small on purpose: this is a live view, not history —
// anything older belongs in the aggregated buckets.
const liveSampleCapacity = 60

// LiveOutcome is the three-state result shown on the realtime strip.
type LiveOutcome string

const (
	LiveOutcomeSuccess LiveOutcome = "success"
	LiveOutcomeFailed  LiveOutcome = "failed"
	LiveOutcomePartial LiveOutcome = "partial"
)

// NormalizeLiveOutcome maps free-form strings onto the three known outcomes.
// Unknown or empty values fall back to success/failed via the success bool path
// in callers; here empty becomes success for defensive defaults.
func NormalizeLiveOutcome(raw string) LiveOutcome {
	switch LiveOutcome(raw) {
	case LiveOutcomeSuccess, LiveOutcomeFailed, LiveOutcomePartial:
		return LiveOutcome(raw)
	default:
		return ""
	}
}

// liveState holds process-local counters for the realtime service panel. It is
// deliberately not persisted or shared across nodes: the panel answers "what is
// this instance doing right now", and aggregated history already lives in the
// metrics buckets.
type liveState struct {
	inFlight atomic.Int64

	mu       sync.RWMutex
	samples  []LiveSample
	next     int
	total    uint64
	lastAt   time.Time
	succeed  uint64
	failured uint64
	partial  uint64
}

var live liveState

// LiveSample is one completed relay request, newest last.
type LiveSample struct {
	// Outcome is success|failed|partial. Prefer this over Success.
	Outcome LiveOutcome `json:"outcome"`
	// Success is true only when Outcome is success (kept for older clients).
	Success   bool   `json:"success"`
	LatencyMs int64  `json:"latency_ms"`
	At        int64  `json:"at"`
	// Group is the group that actually served the request. Empty when the
	// request failed before group resolution (e.g. bad token).
	Group string `json:"group,omitempty"`
	// Reason is a short machine-readable code for tooltips (timeout, client_gone, …).
	Reason string `json:"reason,omitempty"`
}

// LiveGroupSnapshot is the per-group breakdown of the retained samples.
type LiveGroupSnapshot struct {
	Group        string       `json:"group"`
	Samples      []LiveSample `json:"samples"`
	SuccessCount int          `json:"success_count"`
	FailureCount int          `json:"failure_count"`
	PartialCount int          `json:"partial_count"`
	SuccessRate  float64      `json:"success_rate"`
	AvgLatencyMs int64        `json:"avg_latency_ms"`
}

// LiveSnapshot is the payload behind the realtime panel.
type LiveSnapshot struct {
	InFlight      int64        `json:"in_flight"`
	Samples       []LiveSample `json:"samples"`
	TotalRequests uint64       `json:"total_requests"`
	SuccessCount  uint64       `json:"success_count"`
	FailureCount  uint64       `json:"failure_count"`
	PartialCount  uint64       `json:"partial_count"`
	// SuccessRate over the retained samples, 0-100. Only full successes count;
	// partial and failed both reduce the rate. -1 when there is no data,
	// which the frontend renders as the grey "no data" state.
	SuccessRate   float64 `json:"success_rate"`
	LastRequestAt int64   `json:"last_request_at"`
	ServerTime    int64   `json:"server_time"`
	// Groups is the same retained samples split per serving group, busiest
	// first. Requests that never resolved a group are omitted.
	Groups []LiveGroupSnapshot `json:"groups"`
}

// RequestStarted increments the in-flight gauge. Always pair with
// RequestFinished, including on error paths, or the gauge drifts upward.
func RequestStarted() {
	live.inFlight.Add(1)
}

// RequestFinished decrements the in-flight gauge and records the outcome.
// group may be empty when the request failed before a group was resolved.
// reason is optional and only used for UI tooltips.
func RequestFinished(outcome LiveOutcome, latencyMs int64, group, reason string) {
	// Clamp at zero: a stray Finished without a matching Started would otherwise
	// make the gauge negative and stay wrong for the process lifetime.
	if live.inFlight.Add(-1) < 0 {
		live.inFlight.Store(0)
	}

	switch outcome {
	case LiveOutcomeSuccess, LiveOutcomeFailed, LiveOutcomePartial:
	default:
		outcome = LiveOutcomeFailed
	}

	live.mu.Lock()
	defer live.mu.Unlock()

	if live.samples == nil {
		live.samples = make([]LiveSample, liveSampleCapacity)
	}
	live.samples[live.next] = LiveSample{
		Outcome:   outcome,
		Success:   outcome == LiveOutcomeSuccess,
		LatencyMs: latencyMs,
		At:        time.Now().UnixMilli(),
		Group:     group,
		Reason:    reason,
	}
	live.next = (live.next + 1) % liveSampleCapacity
	live.total++
	live.lastAt = time.Now()
	switch outcome {
	case LiveOutcomeSuccess:
		live.succeed++
	case LiveOutcomePartial:
		live.partial++
	default:
		live.failured++
	}
}

// Live returns a copy of the current live state, oldest sample first.
func Live() LiveSnapshot {
	live.mu.RLock()
	defer live.mu.RUnlock()

	snapshot := LiveSnapshot{
		InFlight:      live.inFlight.Load(),
		TotalRequests: live.total,
		SuccessCount:  live.succeed,
		FailureCount:  live.failured,
		PartialCount:  live.partial,
		SuccessRate:   -1,
		ServerTime:    time.Now().UnixMilli(),
	}
	if !live.lastAt.IsZero() {
		snapshot.LastRequestAt = live.lastAt.UnixMilli()
	}

	// The ring is allocated lazily on the first completed request.
	if live.samples == nil {
		return snapshot
	}

	// Walk the ring oldest-first, skipping slots never written to.
	ordered := make([]LiveSample, 0, liveSampleCapacity)
	for i := 0; i < liveSampleCapacity; i++ {
		sample := live.samples[(live.next+i)%liveSampleCapacity]
		if sample.At == 0 {
			continue
		}
		// Older samples written before outcome existed only set Success.
		if sample.Outcome == "" {
			if sample.Success {
				sample.Outcome = LiveOutcomeSuccess
			} else {
				sample.Outcome = LiveOutcomeFailed
			}
		}
		ordered = append(ordered, sample)
	}
	snapshot.Samples = ordered

	if len(ordered) > 0 {
		succeeded := 0
		for _, sample := range ordered {
			if sample.Outcome == LiveOutcomeSuccess || (sample.Outcome == "" && sample.Success) {
				succeeded++
			}
		}
		snapshot.SuccessRate = float64(succeeded) / float64(len(ordered)) * 100
	}

	snapshot.Groups = groupSnapshots(ordered)

	return snapshot
}

// groupSnapshots splits retained samples per serving group, busiest first.
// Samples without a group are skipped: those failed before group resolution, so
// attributing them to any group would be misleading.
func groupSnapshots(ordered []LiveSample) []LiveGroupSnapshot {
	if len(ordered) == 0 {
		return nil
	}

	byGroup := make(map[string][]LiveSample)
	for _, sample := range ordered {
		if sample.Group == "" {
			continue
		}
		byGroup[sample.Group] = append(byGroup[sample.Group], sample)
	}
	if len(byGroup) == 0 {
		return nil
	}

	groups := make([]LiveGroupSnapshot, 0, len(byGroup))
	for name, samples := range byGroup {
		entry := LiveGroupSnapshot{Group: name, Samples: samples}
		var latencyTotal int64
		for _, sample := range samples {
			switch sample.Outcome {
			case LiveOutcomeSuccess:
				entry.SuccessCount++
			case LiveOutcomePartial:
				entry.PartialCount++
			default:
				entry.FailureCount++
			}
			latencyTotal += sample.LatencyMs
		}
		entry.SuccessRate = float64(entry.SuccessCount) / float64(len(samples)) * 100
		entry.AvgLatencyMs = latencyTotal / int64(len(samples))
		groups = append(groups, entry)
	}

	sort.Slice(groups, func(i, j int) bool {
		if len(groups[i].Samples) != len(groups[j].Samples) {
			return len(groups[i].Samples) > len(groups[j].Samples)
		}
		return groups[i].Group < groups[j].Group
	})
	return groups
}
