package perfmetrics

import (
	"sync"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// resetLiveState clears the package-level live counters so each test starts from
// a known state.
func resetLiveState() {
	live.mu.Lock()
	defer live.mu.Unlock()
	live.inFlight.Store(0)
	live.samples = nil
	live.next = 0
	live.total = 0
	live.succeed = 0
	live.failured = 0
	live.lastAt = time.Time{}
}

func TestLiveReportsNoDataBeforeAnyRequest(t *testing.T) {
	resetLiveState()

	snapshot := Live()

	assert.Zero(t, snapshot.InFlight)
	assert.Empty(t, snapshot.Samples)
	assert.EqualValues(t, -1, snapshot.SuccessRate, "no data must be distinguishable from 0%")
	assert.Zero(t, snapshot.LastRequestAt)
}

func TestInFlightTracksStartedMinusFinished(t *testing.T) {
	resetLiveState()

	RequestStarted()
	RequestStarted()
	require.EqualValues(t, 2, Live().InFlight)

	RequestFinished(true, 10)
	assert.EqualValues(t, 1, Live().InFlight)

	RequestFinished(true, 10)
	assert.EqualValues(t, 0, Live().InFlight)
}

func TestInFlightNeverGoesNegative(t *testing.T) {
	resetLiveState()

	// An unmatched Finished (e.g. a handler that reported twice) must not leave
	// the gauge negative for the rest of the process lifetime.
	RequestFinished(false, 5)

	assert.EqualValues(t, 0, Live().InFlight)
}

func TestLiveSuccessRateReflectsRetainedSamples(t *testing.T) {
	resetLiveState()

	RequestStarted()
	RequestFinished(true, 10)
	RequestStarted()
	RequestFinished(true, 10)
	RequestStarted()
	RequestFinished(false, 10)

	snapshot := Live()

	require.Len(t, snapshot.Samples, 3)
	assert.EqualValues(t, 3, snapshot.TotalRequests)
	assert.EqualValues(t, 2, snapshot.SuccessCount)
	assert.EqualValues(t, 1, snapshot.FailureCount)
	assert.InDelta(t, 66.67, snapshot.SuccessRate, 0.01)
}

func TestLiveSamplesAreOldestFirstAndBounded(t *testing.T) {
	resetLiveState()

	// Overflow the ring so the oldest entries are evicted.
	total := liveSampleCapacity + 5
	for i := 0; i < total; i++ {
		RequestStarted()
		RequestFinished(true, int64(i))
	}

	snapshot := Live()

	require.Len(t, snapshot.Samples, liveSampleCapacity, "ring buffer must stay bounded")
	assert.EqualValues(t, total, snapshot.TotalRequests, "lifetime total keeps counting past the ring")
	// Oldest retained latency is the 6th request (0-indexed 5), newest is the last.
	assert.EqualValues(t, total-liveSampleCapacity, snapshot.Samples[0].LatencyMs)
	assert.EqualValues(t, total-1, snapshot.Samples[len(snapshot.Samples)-1].LatencyMs)
}

func TestConcurrentRequestsKeepGaugeConsistent(t *testing.T) {
	resetLiveState()

	const workers = 50
	var wg sync.WaitGroup
	wg.Add(workers)
	for i := 0; i < workers; i++ {
		go func() {
			defer wg.Done()
			RequestStarted()
			RequestFinished(true, 1)
		}()
	}
	wg.Wait()

	snapshot := Live()
	assert.EqualValues(t, 0, snapshot.InFlight, "every start must be balanced by a finish")
	assert.EqualValues(t, workers, snapshot.TotalRequests)
}
