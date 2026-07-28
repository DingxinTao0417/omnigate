package middleware

import (
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/constant"
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
//
// Outcome priority:
//  1. Explicit relay/stream outcome on the gin context (success|failed|partial)
//  2. HTTP status: >= 400 → failed, else success
//
// Stream handlers set the context outcome so mid-stream timeouts and client
// disconnects are not mis-labelled as success just because headers were 200.
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
			outcome, reason := resolveLiveOutcome(c)
			perfmetrics.RequestFinished(
				outcome,
				time.Since(start).Milliseconds(),
				// Read after c.Next(): the distributor resolves the group
				// downstream, so this is empty for requests rejected earlier.
				common.GetContextKeyString(c, constant.ContextKeyUsingGroup),
				reason,
			)
		}()

		c.Next()
	}
}

func resolveLiveOutcome(c *gin.Context) (perfmetrics.LiveOutcome, string) {
	if raw := common.GetContextKeyString(c, constant.ContextKeyRelayLiveOutcome); raw != "" {
		if outcome := perfmetrics.NormalizeLiveOutcome(raw); outcome != "" {
			return outcome, common.GetContextKeyString(c, constant.ContextKeyRelayLiveReason)
		}
	}

	// HTTP status is the only signal when no stream/relay handler tagged the request.
	if c.Writer.Status() >= 400 {
		return perfmetrics.LiveOutcomeFailed, "http_error"
	}
	return perfmetrics.LiveOutcomeSuccess, ""
}
