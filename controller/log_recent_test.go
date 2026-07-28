package controller

import (
	"strings"
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestProjectRecentRelayRequest_ErrorLog(t *testing.T) {
	log := &model.Log{
		Type:      model.LogTypeError,
		RequestId: "req-1",
		ModelName: "claude-sonnet",
		Content:   "upstream returned 503",
		Other: common.MapToJsonStr(map[string]interface{}{
			"error_code":  "upstream_error",
			"status_code": 503,
		}),
	}

	item := projectRecentRelayRequest(log)

	assert.Equal(t, relaycommon.LiveOutcomeFailed, item.Outcome)
	assert.Equal(t, "upstream_error", item.Reason)
	assert.Equal(t, "upstream returned 503", item.Message)
	assert.Equal(t, "req-1", item.RequestId)
}

func TestProjectRecentRelayRequest_ConsumeWithClientGone(t *testing.T) {
	log := &model.Log{
		Type:      model.LogTypeConsume,
		RequestId: "req-2",
		ModelName: "gpt-4o",
		IsStream:  true,
		UseTime:   12,
		Other: common.MapToJsonStr(map[string]interface{}{
			"stream_status": map[string]interface{}{
				"status":     "error",
				"end_reason": "client_gone",
			},
		}),
	}

	item := projectRecentRelayRequest(log)

	assert.Equal(t, relaycommon.LiveOutcomePartial, item.Outcome)
	assert.Equal(t, "client_gone", item.Reason)
	assert.Empty(t, item.Message)
}

func TestProjectRecentRelayRequest_ConsumeCleanSuccess(t *testing.T) {
	log := &model.Log{
		Type:      model.LogTypeConsume,
		RequestId: "req-3",
		ModelName: "gpt-4o",
		Other: common.MapToJsonStr(map[string]interface{}{
			"stream_status": map[string]interface{}{
				"status":     "ok",
				"end_reason": "done",
			},
		}),
	}

	item := projectRecentRelayRequest(log)

	assert.Equal(t, relaycommon.LiveOutcomeSuccess, item.Outcome)
	assert.Equal(t, "done", item.Reason)
}

func TestProjectRecentRelayRequest_ConsumeWithoutStreamStatus(t *testing.T) {
	log := &model.Log{
		Type:      model.LogTypeConsume,
		RequestId: "req-4",
		ModelName: "gpt-4o",
	}

	item := projectRecentRelayRequest(log)

	assert.Equal(t, relaycommon.LiveOutcomeSuccess, item.Outcome)
	assert.Empty(t, item.Reason)
}

func TestTruncateDiagnosticMessage(t *testing.T) {
	require.Equal(t, "short", truncateDiagnosticMessage("short", 10))
	out := truncateDiagnosticMessage(strings.Repeat("a", 20), 10)
	assert.True(t, strings.HasSuffix(out, "…"))
	assert.LessOrEqual(t, len([]rune(out)), 11)
}
