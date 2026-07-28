/*
Copyright (C) 2023-2026 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/
export type PerformanceSeriesPoint = {
  ts: number
  avg_ttft_ms: number
  avg_latency_ms: number
  success_rate: number
  avg_tps: number
}

export type PerformanceGroup = {
  group: string
  avg_ttft_ms: number
  avg_latency_ms: number
  success_rate: number
  avg_tps: number
  series: PerformanceSeriesPoint[]
}

export type PerformanceMetricsData = {
  success: boolean
  message?: string
  data: {
    model_name: string
    series_schema?: string
    groups: PerformanceGroup[]
  }
}

export type PerfModelSummary = {
  model_name: string
  avg_latency_ms: number
  success_rate: number
  avg_tps: number
  recent_success_rates?: number[]
  request_count?: number
}

export type PerfSummaryAllData = {
  success: boolean
  message?: string
  data: {
    models: PerfModelSummary[]
  }
}

/** Three-state live strip outcome; prefer over boolean success when present. */
export type PerfLiveOutcome = 'success' | 'failed' | 'partial'

export type PerfLiveSample = {
  /**
   * True only for a full success. Kept for older backends; prefer `outcome`.
   */
  success: boolean
  /**
   * success | failed | partial. Partial covers mid-stream client disconnects
   * (common with client-side reconnect) that still opened as HTTP 200.
   */
  outcome?: PerfLiveOutcome
  /** Short machine-readable code for tooltips (timeout, client_gone, …). */
  reason?: string
  latency_ms: number
  /** Unix milliseconds. */
  at: number
  /** Serving group; absent when the request failed before group resolution. */
  group?: string
}

export type HealthComponentStatus = 'ok' | 'degraded' | 'down' | 'disabled'

export type HealthComponent = {
  status: HealthComponentStatus
  latency_ms: number
  detail?: string
}

export type SystemHealthData = {
  success: boolean
  message?: string
  data: {
    database: HealthComponent
    redis: HealthComponent
    channels: {
      total: number
      enabled: number
      manually_disabled: number
      auto_disabled: number
    }
    server_time: number
  }
}

export type PerfLiveGroup = {
  group: string
  samples: PerfLiveSample[]
  success_count: number
  failure_count: number
  partial_count?: number
  success_rate: number
  avg_latency_ms: number
}

export type PerfLiveData = {
  success: boolean
  message?: string
  data: {
    in_flight: number
    samples: PerfLiveSample[]
    total_requests: number
    success_count: number
    failure_count: number
    partial_count?: number
    /** 0-100 over retained samples; -1 when there is no data at all. */
    success_rate: number
    last_request_at: number
    server_time: number
    /** Per-group breakdown, busiest first. Empty when no group resolved. */
    groups?: PerfLiveGroup[]
  }
}
