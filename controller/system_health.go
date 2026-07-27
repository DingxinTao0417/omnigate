package controller

import (
	"context"
	"net/http"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"

	"github.com/gin-gonic/gin"
)

// healthProbeTimeout bounds each dependency probe so a hung backing service
// cannot stall the whole health response.
const healthProbeTimeout = 2 * time.Second

type componentHealth struct {
	// Status is one of "ok", "degraded", "down" or "disabled".
	Status    string `json:"status"`
	LatencyMs int64  `json:"latency_ms"`
	Detail    string `json:"detail,omitempty"`
}

type channelHealth struct {
	Total            int64 `json:"total"`
	Enabled          int64 `json:"enabled"`
	ManuallyDisabled int64 `json:"manually_disabled"`
	AutoDisabled     int64 `json:"auto_disabled"`
}

type systemHealthResponse struct {
	Database   componentHealth `json:"database"`
	Redis      componentHealth `json:"redis"`
	Channels   channelHealth   `json:"channels"`
	ServerTime int64           `json:"server_time"`
}

// GetSystemHealth probes the backing services the gateway depends on. Each probe
// is timed so the console can distinguish "reachable but slow" from "down".
func GetSystemHealth(c *gin.Context) {
	response := systemHealthResponse{
		Database:   probeDatabase(),
		Redis:      probeRedis(),
		Channels:   probeChannels(),
		ServerTime: time.Now().UnixMilli(),
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    response,
	})
}

func probeDatabase() componentHealth {
	sqlDB, err := model.DB.DB()
	if err != nil {
		return componentHealth{Status: "down", Detail: err.Error()}
	}

	ctx, cancel := context.WithTimeout(context.Background(), healthProbeTimeout)
	defer cancel()

	// Ping directly rather than via model.PingDB: that helper throttles to one
	// real ping every 10s and returns nil in between, which would report a stale
	// "ok" and a meaningless latency.
	start := time.Now()
	if err := sqlDB.PingContext(ctx); err != nil {
		return componentHealth{
			Status:    "down",
			LatencyMs: time.Since(start).Milliseconds(),
			Detail:    err.Error(),
		}
	}
	return componentHealth{
		Status:    "ok",
		LatencyMs: time.Since(start).Milliseconds(),
	}
}

func probeRedis() componentHealth {
	if !common.RedisEnabled || common.RDB == nil {
		return componentHealth{Status: "disabled"}
	}

	ctx, cancel := context.WithTimeout(context.Background(), healthProbeTimeout)
	defer cancel()

	start := time.Now()
	if err := common.RDB.Ping(ctx).Err(); err != nil {
		return componentHealth{
			Status:    "down",
			LatencyMs: time.Since(start).Milliseconds(),
			Detail:    err.Error(),
		}
	}
	return componentHealth{
		Status:    "ok",
		LatencyMs: time.Since(start).Milliseconds(),
	}
}

func probeChannels() channelHealth {
	var health channelHealth
	countByStatus := func(status int) int64 {
		var count int64
		if err := model.DB.Model(&model.Channel{}).
			Where("status = ?", status).
			Count(&count).Error; err != nil {
			return 0
		}
		return count
	}

	if err := model.DB.Model(&model.Channel{}).Count(&health.Total).Error; err != nil {
		return health
	}
	health.Enabled = countByStatus(common.ChannelStatusEnabled)
	health.ManuallyDisabled = countByStatus(common.ChannelStatusManuallyDisabled)
	health.AutoDisabled = countByStatus(common.ChannelStatusAutoDisabled)
	return health
}
