package controller

import (
	"net/http"
	"strconv"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	relaycommon "github.com/QuantumNous/new-api/relay/common"

	"github.com/gin-gonic/gin"
)

func GetAllLogs(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	logType, _ := strconv.Atoi(c.Query("type"))
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	username := c.Query("username")
	tokenName := c.Query("token_name")
	modelName := c.Query("model_name")
	channel, _ := strconv.Atoi(c.Query("channel"))
	group := c.Query("group")
	requestId := c.Query("request_id")
	upstreamRequestId := c.Query("upstream_request_id")
	logs, total, err := model.GetAllLogs(logType, startTimestamp, endTimestamp, modelName, username, tokenName, pageInfo.GetStartIdx(), pageInfo.GetPageSize(), channel, group, requestId, upstreamRequestId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(logs)
	common.ApiSuccess(c, pageInfo)
	return
}

func GetUserLogs(c *gin.Context) {
	pageInfo := common.GetPageQuery(c)
	userId := c.GetInt("id")
	logType, _ := strconv.Atoi(c.Query("type"))
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	tokenName := c.Query("token_name")
	modelName := c.Query("model_name")
	group := c.Query("group")
	requestId := c.Query("request_id")
	upstreamRequestId := c.Query("upstream_request_id")
	logs, total, err := model.GetUserLogs(userId, logType, startTimestamp, endTimestamp, modelName, tokenName, pageInfo.GetStartIdx(), pageInfo.GetPageSize(), group, requestId, upstreamRequestId)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(logs)
	common.ApiSuccess(c, pageInfo)
	return
}

// recentRelayRequest is a user-safe projection of consume/error logs for the
// service-status "my recent requests" panel and copy-to-clipboard diagnostics.
type recentRelayRequest struct {
	RequestId        string `json:"request_id"`
	CreatedAt        int64  `json:"created_at"`
	Type             int    `json:"type"`
	ModelName        string `json:"model_name"`
	TokenName        string `json:"token_name"`
	UseTime          int    `json:"use_time"`
	IsStream         bool   `json:"is_stream"`
	Quota            int    `json:"quota"`
	PromptTokens     int    `json:"prompt_tokens"`
	CompletionTokens int    `json:"completion_tokens"`
	// Outcome is success|failed|partial.
	Outcome string `json:"outcome"`
	// Reason is a short machine-readable code (timeout, client_gone, error, …).
	Reason string `json:"reason,omitempty"`
	// Message is a short user-visible error summary for failed requests.
	Message string `json:"message,omitempty"`
	Group   string `json:"group,omitempty"`
}

// GetUserRecentRequests returns the current user's newest consume/error logs as
// compact diagnostic rows (no channel/admin fields).
func GetUserRecentRequests(c *gin.Context) {
	userId := c.GetInt("id")
	limit, _ := strconv.Atoi(c.Query("limit"))
	logs, err := model.GetUserRecentRelayLogs(userId, limit)
	if err != nil {
		common.ApiError(c, err)
		return
	}

	items := make([]recentRelayRequest, 0, len(logs))
	for _, log := range logs {
		if log == nil {
			continue
		}
		items = append(items, projectRecentRelayRequest(log))
	}
	common.ApiSuccess(c, gin.H{
		"items": items,
	})
}

func projectRecentRelayRequest(log *model.Log) recentRelayRequest {
	item := recentRelayRequest{
		RequestId:        log.RequestId,
		CreatedAt:        log.CreatedAt,
		Type:             log.Type,
		ModelName:        log.ModelName,
		TokenName:        log.TokenName,
		UseTime:          log.UseTime,
		IsStream:         log.IsStream,
		Quota:            log.Quota,
		PromptTokens:     log.PromptTokens,
		CompletionTokens: log.CompletionTokens,
		Group:            log.Group,
		Outcome:          relaycommon.LiveOutcomeSuccess,
	}

	other, _ := common.StrToMap(log.Other)

	if log.Type == model.LogTypeError {
		item.Outcome = relaycommon.LiveOutcomeFailed
		item.Reason = "error"
		item.Message = truncateDiagnosticMessage(log.Content, 240)
		if other != nil {
			if code, ok := other["error_code"].(string); ok && code != "" {
				item.Reason = code
			} else if codeNum, ok := other["status_code"].(float64); ok && codeNum > 0 {
				item.Reason = "http_" + strconv.Itoa(int(codeNum))
			}
		}
		return item
	}

	// Consume logs: derive partial/failed from persisted stream_status when present.
	if other != nil {
		if ss, ok := other["stream_status"].(map[string]interface{}); ok && ss != nil {
			endReason, _ := ss["end_reason"].(string)
			hasErrors := false
			if status, ok := ss["status"].(string); ok && status == "error" {
				hasErrors = true
			}
			if count, ok := ss["error_count"].(float64); ok && count > 0 {
				hasErrors = true
			}
			outcome, reason := relaycommon.ClassifyLiveOutcome(
				relaycommon.StreamEndReason(endReason),
				hasErrors,
			)
			item.Outcome = outcome
			item.Reason = reason
		}
	}
	return item
}

func truncateDiagnosticMessage(msg string, max int) string {
	msg = strings.TrimSpace(msg)
	if max <= 0 || len(msg) <= max {
		return msg
	}
	// Avoid cutting mid-rune.
	runes := []rune(msg)
	if len(runes) <= max {
		return msg
	}
	return string(runes[:max]) + "…"
}

// Deprecated: SearchAllLogs 已废弃，前端未使用该接口。
func SearchAllLogs(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": false,
		"message": "该接口已废弃",
	})
}

// Deprecated: SearchUserLogs 已废弃，前端未使用该接口。
func SearchUserLogs(c *gin.Context) {
	c.JSON(http.StatusOK, gin.H{
		"success": false,
		"message": "该接口已废弃",
	})
}

func GetLogByKey(c *gin.Context) {
	tokenId := c.GetInt("token_id")
	if tokenId == 0 {
		c.JSON(200, gin.H{
			"success": false,
			"message": "无效的令牌",
		})
		return
	}
	logs, err := model.GetLogByTokenId(tokenId)
	if err != nil {
		c.JSON(200, gin.H{
			"success": false,
			"message": err.Error(),
		})
		return
	}
	c.JSON(200, gin.H{
		"success": true,
		"message": "",
		"data":    logs,
	})
}

func GetLogsStat(c *gin.Context) {
	logType, _ := strconv.Atoi(c.Query("type"))
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	tokenName := c.Query("token_name")
	username := c.Query("username")
	modelName := c.Query("model_name")
	channel, _ := strconv.Atoi(c.Query("channel"))
	group := c.Query("group")
	stat, err := model.SumUsedQuota(logType, startTimestamp, endTimestamp, modelName, username, tokenName, channel, group)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	//tokenNum := model.SumUsedToken(logType, startTimestamp, endTimestamp, modelName, username, "")
	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"quota": stat.Quota,
			"rpm":   stat.Rpm,
			"tpm":   stat.Tpm,
		},
	})
	return
}

func GetLogsSelfStat(c *gin.Context) {
	username := c.GetString("username")
	logType, _ := strconv.Atoi(c.Query("type"))
	startTimestamp, _ := strconv.ParseInt(c.Query("start_timestamp"), 10, 64)
	endTimestamp, _ := strconv.ParseInt(c.Query("end_timestamp"), 10, 64)
	tokenName := c.Query("token_name")
	modelName := c.Query("model_name")
	channel, _ := strconv.Atoi(c.Query("channel"))
	group := c.Query("group")
	quotaNum, err := model.SumUsedQuota(logType, startTimestamp, endTimestamp, modelName, username, tokenName, channel, group)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	//tokenNum := model.SumUsedToken(logType, startTimestamp, endTimestamp, modelName, username, tokenName)
	c.JSON(200, gin.H{
		"success": true,
		"message": "",
		"data": gin.H{
			"quota": quotaNum.Quota,
			"rpm":   quotaNum.Rpm,
			"tpm":   quotaNum.Tpm,
			//"token": tokenNum,
		},
	})
	return
}
