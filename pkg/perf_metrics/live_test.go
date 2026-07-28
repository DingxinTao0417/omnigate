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
	live.partial = 0
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

	RequestFinished(LiveOutcomeSuccess, 10, "default", "")
	assert.EqualValues(t, 1, Live().InFlight)

	RequestFinished(LiveOutcomeSuccess, 10, "default", "")
	assert.EqualValues(t, 0, Live().InFlight)
}

func TestInFlightNeverGoesNegative(t *testing.T) {
	resetLiveState()

	// An unmatched Finished (e.g. a handler that reported twice) must not leave
	// the gauge negative for the rest of the process lifetime.
	RequestFinished(LiveOutcomeFailed, 5, "", "http_error")

	assert.EqualValues(t, 0, Live().InFlight)
}

func TestLiveSuccessRateReflectsRetainedSamples(t *testing.T) {
	resetLiveState()

	RequestStarted()
	RequestFinished(LiveOutcomeSuccess, 10, "default", "")
	RequestStarted()
	RequestFinished(LiveOutcomeSuccess, 10, "default", "")
	RequestStarted()
	RequestFinished(LiveOutcomeFailed, 10, "default", "http_error")

	snapshot := Live()

	require.Len(t, snapshot.Samples, 3)
	assert.EqualValues(t, 3, snapshot.TotalRequests)
	assert.EqualValues(t, 2, snapshot.SuccessCount)
	assert.EqualValues(t, 1, snapshot.FailureCount)
	assert.InDelta(t, 66.67, snapshot.SuccessRate, 0.01)
}

func TestLivePartialDoesNotCountAsSuccess(t *testing.T) {
	resetLiveState()

	RequestStarted()
	RequestFinished(LiveOutcomeSuccess, 10, "default", "done")
	RequestStarted()
	RequestFinished(LiveOutcomePartial, 20, "default", "client_gone")
	RequestStarted()
	RequestFinished(LiveOutcomeFailed, 30, "default", "timeout")

	snapshot := Live()

	require.Len(t, snapshot.Samples, 3)
	assert.EqualValues(t, 1, snapshot.SuccessCount)
	assert.EqualValues(t, 1, snapshot.PartialCount)
	assert.EqualValues(t, 1, snapshot.FailureCount)
	assert.InDelta(t, 33.33, snapshot.SuccessRate, 0.01)

	lastPartial := snapshot.Samples[1]
	assert.Equal(t, LiveOutcomePartial, lastPartial.Outcome)
	assert.False(t, lastPartial.Success)
	assert.Equal(t, "client_gone", lastPartial.Reason)
}

func TestLiveSamplesAreOldestFirstAndBounded(t *testing.T) {
	resetLiveState()

	// Overflow the ring so the oldest entries are evicted.
	total := liveSampleCapacity + 5
	for i := 0; i < total; i++ {
		RequestStarted()
		RequestFinished(LiveOutcomeSuccess, int64(i), "default", "")
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
			RequestFinished(LiveOutcomeSuccess, 1, "default", "")
		}()
	}
	wg.Wait()

	snapshot := Live()
	assert.EqualValues(t, 0, snapshot.InFlight, "every start must be balanced by a finish")
	assert.EqualValues(t, workers, snapshot.TotalRequests)
}

func TestLiveGroupsSplitSamplesByServingGroup(t *testing.T) {
	resetLiveState()

	// vip: 2 ok, 1 failed. default: 1 ok.
	for _, sample := range []struct {
		outcome LiveOutcome
		group   string
	}{
		{LiveOutcomeSuccess, "vip"},
		{LiveOutcomeSuccess, "vip"},
		{LiveOutcomeFailed, "vip"},
		{LiveOutcomeSuccess, "default"},
	} {
		RequestStarted()
		RequestFinished(sample.outcome, 20, sample.group, "")
	}

	groups := Live().Groups
	require.Len(t, groups, 2)

	// Busiest group first.
	assert.Equal(t, "vip", groups[0].Group)
	assert.Equal(t, 2, groups[0].SuccessCount)
	assert.Equal(t, 1, groups[0].FailureCount)
	assert.InDelta(t, 66.67, groups[0].SuccessRate, 0.01)
	assert.EqualValues(t, 20, groups[0].AvgLatencyMs)

	assert.Equal(t, "default", groups[1].Group)
	assert.Equal(t, 1, groups[1].SuccessCount)
}

func TestLiveGroupsCountPartialSeparately(t *testing.T) {
	resetLiveState()

	RequestStarted()
	RequestFinished(LiveOutcomeSuccess, 10, "vip", "done")
	RequestStarted()
	RequestFinished(LiveOutcomePartial, 15, "vip", "client_gone")

	groups := Live().Groups
	require.Len(t, groups, 1)
	assert.Equal(t, 1, groups[0].SuccessCount)
	assert.Equal(t, 1, groups[0].PartialCount)
	assert.Equal(t, 0, groups[0].FailureCount)
	assert.InDelta(t, 50.0, groups[0].SuccessRate, 0.01)
}

func TestLiveGroupsOmitSamplesWithoutAGroup(t *testing.T) {
	resetLiveState()

	// A request rejected before group resolution (e.g. invalid token) must not
	// be attributed to any group, but still counts in the overall totals.
	RequestStarted()
	RequestFinished(LiveOutcomeFailed, 3, "", "http_error")

	snapshot := Live()

	require.Len(t, snapshot.Samples, 1, "still counted overall")
	assert.EqualValues(t, 0, snapshot.SuccessRate)
	assert.Empty(t, snapshot.Groups, "no group can be blamed for it")
}
