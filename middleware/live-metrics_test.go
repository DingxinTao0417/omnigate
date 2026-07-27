package middleware

import (
	"net/http"
	"net/http/httptest"
	"testing"

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
	assert.True(t, snapshot.Samples[len(snapshot.Samples)-1].Success)
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
	assert.False(t, snapshot.Samples[len(snapshot.Samples)-1].Success)
	assert.Zero(t, snapshot.InFlight)
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
