package perfmetrics

import (
	"sync"
	"sync/atomic"
	"time"
)

// liveSampleCapacity bounds the in-memory ring buffer used to render the
// "recent requests" strip. Small on purpose: this is a live view, not history —
// anything older belongs in the aggregated buckets.
const liveSampleCapacity = 60

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
}

var live liveState

// LiveSample is one completed relay request, newest last.
type LiveSample struct {
	Success   bool  `json:"success"`
	LatencyMs int64 `json:"latency_ms"`
	At        int64 `json:"at"`
}

// LiveSnapshot is the payload behind the realtime panel.
type LiveSnapshot struct {
	InFlight      int64        `json:"in_flight"`
	Samples       []LiveSample `json:"samples"`
	TotalRequests uint64       `json:"total_requests"`
	SuccessCount  uint64       `json:"success_count"`
	FailureCount  uint64       `json:"failure_count"`
	// SuccessRate over the retained samples, 0-100. -1 when there is no data,
	// which the frontend renders as the grey "no data" state.
	SuccessRate   float64 `json:"success_rate"`
	LastRequestAt int64   `json:"last_request_at"`
	ServerTime    int64   `json:"server_time"`
}

// RequestStarted increments the in-flight gauge. Always pair with
// RequestFinished, including on error paths, or the gauge drifts upward.
func RequestStarted() {
	live.inFlight.Add(1)
}

// RequestFinished decrements the in-flight gauge and records the outcome.
func RequestFinished(success bool, latencyMs int64) {
	// Clamp at zero: a stray Finished without a matching Started would otherwise
	// make the gauge negative and stay wrong for the process lifetime.
	if live.inFlight.Add(-1) < 0 {
		live.inFlight.Store(0)
	}

	live.mu.Lock()
	defer live.mu.Unlock()

	if live.samples == nil {
		live.samples = make([]LiveSample, liveSampleCapacity)
	}
	live.samples[live.next] = LiveSample{
		Success:   success,
		LatencyMs: latencyMs,
		At:        time.Now().UnixMilli(),
	}
	live.next = (live.next + 1) % liveSampleCapacity
	live.total++
	live.lastAt = time.Now()
	if success {
		live.succeed++
	} else {
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
		ordered = append(ordered, sample)
	}
	snapshot.Samples = ordered

	if len(ordered) > 0 {
		succeeded := 0
		for _, sample := range ordered {
			if sample.Success {
				succeeded++
			}
		}
		snapshot.SuccessRate = float64(succeeded) / float64(len(ordered)) * 100
	}

	return snapshot
}
