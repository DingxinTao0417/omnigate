package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
	perfmetrics "github.com/QuantumNous/new-api/pkg/perf_metrics"

	"github.com/gin-gonic/gin"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func newLiveMetricsRouter(t *testing.T, handler gin.HandlerFunc) *gin.Engine {
	t.Helper()
	gin.SetMode(gin.TestMode)
	router := gin.New()
	router.Use(LiveMetrics())
	router.POST("/relay", handler)
	return router
}

func TestLiveMetricsRecordsSuccessForOkStatus(t *testing.T) {
	before := perfmetrics.Live().TotalRequests
	router := newLiveMetricsRouter(t, func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"ok": true})
	})

	router.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/relay", nil))

	snapshot := perfmetrics.Live()
	require.EqualValues(t, before+1, snapshot.TotalRequests)
	last := snapshot.Samples[len(snapshot.Samples)-1]
	assert.Equal(t, perfmetrics.LiveOutcomeSuccess, last.Outcome)
	assert.True(t, last.Success)
	assert.Zero(t, snapshot.InFlight, "gauge must be released after the handler returns")
}

func TestLiveMetricsRecordsFailureForErrorStatus(t *testing.T) {
	before := perfmetrics.Live().TotalRequests
	router := newLiveMetricsRouter(t, func(c *gin.Context) {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "no channel"})
	})

	router.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/relay", nil))

	snapshot := perfmetrics.Live()
	require.EqualValues(t, before+1, snapshot.TotalRequests)
	last := snapshot.Samples[len(snapshot.Samples)-1]
	assert.Equal(t, perfmetrics.LiveOutcomeFailed, last.Outcome)
	assert.False(t, last.Success)
	assert.Equal(t, "http_error", last.Reason)
	assert.Zero(t, snapshot.InFlight)
}

func TestLiveMetricsPrefersStreamOutcomeOverHttpStatus(t *testing.T) {
	before := perfmetrics.Live().TotalRequests
	router := newLiveMetricsRouter(t, func(c *gin.Context) {
		// Streaming responses commonly open with 200 then disconnect mid-body.
		c.Status(http.StatusOK)
		common.SetContextKey(c, constant.ContextKeyRelayLiveOutcome, perfmetrics.LiveOutcomePartial)
		common.SetContextKey(c, constant.ContextKeyRelayLiveReason, "client_gone")
	})

	router.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/relay", nil))

	snapshot := perfmetrics.Live()
	require.EqualValues(t, before+1, snapshot.TotalRequests)
	last := snapshot.Samples[len(snapshot.Samples)-1]
	assert.Equal(t, perfmetrics.LiveOutcomePartial, last.Outcome)
	assert.False(t, last.Success)
	assert.Equal(t, "client_gone", last.Reason)
}

func TestLiveMetricsUsesStreamFailedOutcome(t *testing.T) {
	before := perfmetrics.Live().TotalRequests
	router := newLiveMetricsRouter(t, func(c *gin.Context) {
		c.Status(http.StatusOK)
		common.SetContextKey(c, constant.ContextKeyRelayLiveOutcome, perfmetrics.LiveOutcomeFailed)
		common.SetContextKey(c, constant.ContextKeyRelayLiveReason, "timeout")
	})

	router.ServeHTTP(httptest.NewRecorder(), httptest.NewRequest(http.MethodPost, "/relay", nil))

	last := perfmetrics.Live().Samples[len(perfmetrics.Live().Samples)-1]
	require.EqualValues(t, before+1, perfmetrics.Live().TotalRequests)
	assert.Equal(t, perfmetrics.LiveOutcomeFailed, last.Outcome)
	assert.Equal(t, "timeout", last.Reason)
}

func TestLiveMetricsReleasesGaugeOnPanic(t *testing.T) {
	router := newLiveMetricsRouter(t, func(_ *gin.Context) {
		panic("boom")
	})
	// gin.New() has no recovery middleware, so catch the panic here instead.
	router.Use(gin.Recovery())

	assert.Panics(t, func() {
		router.ServeHTTP(
			httptest.NewRecorder(),
			httptest.NewRequest(http.MethodPost, "/relay", nil),
		)
	})

	assert.Zero(t, perfmetrics.Live().InFlight,
		"a panicking handler must not leave the in-flight gauge inflated")
}
