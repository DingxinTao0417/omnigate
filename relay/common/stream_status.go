package common

import (
	"fmt"
	"strings"
	"sync"
	"time"
)

type StreamEndReason string

const (
	StreamEndReasonNone        StreamEndReason = ""
	StreamEndReasonDone        StreamEndReason = "done"
	StreamEndReasonTimeout     StreamEndReason = "timeout"
	StreamEndReasonClientGone  StreamEndReason = "client_gone"
	StreamEndReasonScannerErr  StreamEndReason = "scanner_error"
	StreamEndReasonHandlerStop StreamEndReason = "handler_stop"
	StreamEndReasonEOF         StreamEndReason = "eof"
	StreamEndReasonPanic       StreamEndReason = "panic"
	StreamEndReasonPingFail    StreamEndReason = "ping_fail"
)

const maxStreamErrorEntries = 20

type StreamErrorEntry struct {
	Message   string
	Timestamp time.Time
}

type StreamStatus struct {
	EndReason  StreamEndReason
	EndError   error
	endOnce    sync.Once

	mu         sync.Mutex
	Errors     []StreamErrorEntry
	ErrorCount int
}

func NewStreamStatus() *StreamStatus {
	return &StreamStatus{}
}

func (s *StreamStatus) SetEndReason(reason StreamEndReason, err error) {
	if s == nil {
		return
	}
	s.endOnce.Do(func() {
		s.EndReason = reason
		s.EndError = err
	})
}

func (s *StreamStatus) RecordError(msg string) {
	if s == nil {
		return
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	s.ErrorCount++
	if len(s.Errors) < maxStreamErrorEntries {
		s.Errors = append(s.Errors, StreamErrorEntry{
			Message:   msg,
			Timestamp: time.Now(),
		})
	}
}

func (s *StreamStatus) HasErrors() bool {
	if s == nil {
		return false
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.ErrorCount > 0
}

func (s *StreamStatus) TotalErrorCount() int {
	if s == nil {
		return 0
	}
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.ErrorCount
}

func (s *StreamStatus) IsNormalEnd() bool {
	if s == nil {
		return true
	}
	return s.EndReason == StreamEndReasonDone ||
		s.EndReason == StreamEndReasonEOF ||
		s.EndReason == StreamEndReasonHandlerStop
}

// Live outcome values written into the gin context for the realtime panel.
// Kept as plain strings so middleware/perf packages do not import this type.
const (
	LiveOutcomeSuccess = "success"
	LiveOutcomeFailed  = "failed"
	LiveOutcomePartial = "partial"
)

// ClassifyLiveOutcome maps a stream end reason (+ soft-error flag) onto the
// live-panel three-state outcome. Shared by in-request StreamStatus and by
// persisted consume-log stream_status payloads.
//
//   - failed: hard stream failures (timeout, scanner/panic/ping errors, handler
//     stop with recorded errors)
//   - partial: client disconnected mid-stream (common for client-side retry /
//     reconnect flows that still looked like HTTP 200)
//   - success: clean completion (done / clean eof / clean handler stop)
//
// EOF alone stays success: many non-OpenAI providers close the body without a
// [DONE] marker, so treating bare EOF as partial would amber-flood healthy traffic.
func ClassifyLiveOutcome(endReason StreamEndReason, hasErrors bool) (outcome string, reason string) {
	reason = string(endReason)
	switch endReason {
	case StreamEndReasonTimeout, StreamEndReasonScannerErr, StreamEndReasonPanic, StreamEndReasonPingFail:
		return LiveOutcomeFailed, reason
	case StreamEndReasonClientGone:
		return LiveOutcomePartial, reason
	case StreamEndReasonHandlerStop:
		if hasErrors {
			return LiveOutcomeFailed, reason
		}
		return LiveOutcomeSuccess, reason
	case StreamEndReasonDone, StreamEndReasonEOF:
		return LiveOutcomeSuccess, reason
	case StreamEndReasonNone:
		// StreamEndReasonNone is already "" — do not also case "" or the
		// compiler reports a duplicate constant case.
		if hasErrors {
			return LiveOutcomeFailed, reason
		}
		return LiveOutcomeSuccess, reason
	default:
		if hasErrors {
			return LiveOutcomeFailed, reason
		}
		return LiveOutcomeSuccess, reason
	}
}

// LiveOutcome classifies this stream for the service-status strip.
func (s *StreamStatus) LiveOutcome() (outcome string, reason string) {
	if s == nil {
		return LiveOutcomeSuccess, ""
	}
	return ClassifyLiveOutcome(s.EndReason, s.HasErrors())
}

func (s *StreamStatus) Summary() string {
	if s == nil {
		return "StreamStatus<nil>"
	}
	b := &strings.Builder{}
	fmt.Fprintf(b, "reason=%s", s.EndReason)
	if s.EndError != nil {
		fmt.Fprintf(b, " end_error=%q", s.EndError.Error())
	}
	s.mu.Lock()
	if s.ErrorCount > 0 {
		fmt.Fprintf(b, " soft_errors=%d", s.ErrorCount)
	}
	s.mu.Unlock()
	return b.String()
}
