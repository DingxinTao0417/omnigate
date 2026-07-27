package middleware

import (
	"time"

	perfmetrics "github.com/QuantumNous/new-api/pkg/perf_metrics"
	"github.com/QuantumNous/new-api/setting/perf_metrics_setting"

	"github.com/gin-gonic/gin"
)

// LiveMetrics tracks in-flight relay requests and their outcomes so the console
// can render a realtime service panel.
//
// The aggregated metrics buckets are written after billing settles, which is too
// late (and too coarse) to answer "how many requests are running right now".
// This middleware wraps the whole relay handler chain instead, so a request is
// counted from the moment it is accepted until the response is fully written —
// including requests that fail before any billing happens.
func LiveMetrics() func(c *gin.Context) {
	return func(c *gin.Context) {
		if !perf_metrics_setting.GetSetting().Enabled {
			c.Next()
			return
		}

		start := time.Now()
		perfmetrics.RequestStarted()
		// Deferred so the gauge is released even if a downstream handler panics;
		// the recovery middleware would otherwise leave it permanently inflated.
		defer func() {
			perfmetrics.RequestFinished(
				c.Writer.Status() < 400,
				time.Since(start).Milliseconds(),
			)
		}()

		c.Next()
	}
}
