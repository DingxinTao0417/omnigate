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
import type { PerfLiveOutcome } from '@/features/performance-metrics/types'

export type RequestOutcome = PerfLiveOutcome

/** Map backend reason codes to user-facing labels. */
export function requestReasonLabel(
  t: (key: string) => string,
  reason: string | undefined
): string | null {
  if (!reason) return null
  const labels: Record<string, string> = {
    done: t('Completed'),
    eof: t('Stream ended'),
    timeout: t('Stream timeout'),
    client_gone: t('Client disconnected'),
    scanner_error: t('Stream read error'),
    panic: t('Internal stream error'),
    ping_fail: t('Keepalive failed'),
    handler_stop: t('Handler stopped'),
    http_error: t('HTTP error'),
    error: t('Request error'),
  }
  if (labels[reason]) return labels[reason]
  if (reason.startsWith('http_')) return t('HTTP error')
  // Upstream error_code strings stay readable as-is.
  return reason
}

export function requestOutcomeLabel(
  t: (key: string) => string,
  outcome: RequestOutcome
): string {
  switch (outcome) {
    case 'success':
      return t('Success')
    case 'partial':
      return t('Incomplete')
    case 'failed':
      return t('Failed')
  }
}

export function requestOutcomeDotClass(outcome: RequestOutcome): string {
  switch (outcome) {
    case 'success':
      return 'bg-emerald-500'
    case 'partial':
      return 'bg-amber-500'
    case 'failed':
      return 'bg-red-500'
  }
}
