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
import { useQuery } from '@tanstack/react-query'
import { Activity, Info } from 'lucide-react'
import { useReducedMotion } from 'motion/react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { IconBadge } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getPerfMetricsLive } from '@/features/performance-metrics/api'
import {
  formatLatency,
  getLiveOutcomeBarClass,
  getLiveOutcomeBarHeight,
  getLiveSampleOutcome,
  getSuccessRateDotClass,
  getSuccessRateLevel,
  getSuccessRateTextClass,
} from '@/features/performance-metrics/lib/format'
import type {
  PerfLiveOutcome,
  PerfLiveSample,
} from '@/features/performance-metrics/types'
import { cn } from '@/lib/utils'

/** Poll cadence; the progress ring completes exactly one turn per cycle. */
const POLL_INTERVAL_MS = 3000

/** Newest-last sample bars. Older entries are dropped to keep the strip legible. */
const VISIBLE_SAMPLES = 40

/** Map backend reason codes to user-facing labels. */
function liveReasonLabel(
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
  }
  return labels[reason] ?? reason
}

function liveOutcomeLabel(
  t: (key: string) => string,
  outcome: PerfLiveOutcome
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

function LiveStatusLegend() {
  const { t } = useTranslation()

  const rateRows = [
    { dot: 'bg-emerald-500', label: t('Success rate 100%') },
    { dot: 'bg-emerald-400', label: t('Success rate >= 90%') },
    { dot: 'bg-amber-500', label: t('Success rate >= 70%') },
    { dot: 'bg-red-500', label: t('Success rate < 70%') },
    { dot: 'bg-muted-foreground', label: t('No data yet') },
  ]

  const barRows = [
    { dot: 'bg-emerald-500', label: t('Bar: full success') },
    { dot: 'bg-amber-500', label: t('Bar: incomplete / interrupted') },
    { dot: 'bg-red-500', label: t('Bar: failed') },
  ]

  return (
    <div className='space-y-2 text-xs'>
      <div className='space-y-1'>
        {rateRows.map((row) => (
          <div className='flex items-center gap-2' key={row.label}>
            <span className={cn('size-1.5 rounded-full', row.dot)} />
            <span>{row.label}</span>
          </div>
        ))}
      </div>
      <div className='space-y-1 border-t pt-2'>
        {barRows.map((row) => (
          <div className='flex items-center gap-2' key={row.label}>
            <span className={cn('size-1.5 rounded-full', row.dot)} />
            <span>{row.label}</span>
          </div>
        ))}
      </div>
      <p className='text-muted-foreground border-t pt-2'>
        {t(
          'Bars are the most recent requests (green = success, amber = incomplete/interrupted, red = failed). Incomplete often means the client disconnected mid-stream and may reconnect. The ring tracks the 3s poll cycle, and the pulsing number is how many requests are in flight right now.'
        )}
      </p>
    </div>
  )
}

/** Oldest-left strip of request outcomes; shared by the overall and per-group views. */
export function SampleStrip(props: {
  samples: PerfLiveSample[]
  className?: string
}) {
  const { t } = useTranslation()

  return (
    <div className={cn('flex h-8 items-end gap-[3px]', props.className)}>
      {props.samples.map((sample) => {
        const outcome = getLiveSampleOutcome(sample)
        const reasonLabel = liveReasonLabel(t, sample.reason)
        // Timestamp + latency + outcome is unique enough in practice; two
        // requests finishing in the same millisecond with identical latency and
        // result are interchangeable for rendering purposes anyway.
        return (
          <Tooltip
            key={`${sample.at}-${sample.latency_ms}-${outcome}-${sample.reason ?? ''}`}
          >
            <TooltipTrigger
              className={cn(
                'min-w-[3px] flex-1 rounded-sm transition-opacity hover:opacity-70',
                getLiveOutcomeBarClass(outcome)
              )}
              // Partial/failed bars are shorter so the strip stays readable in
              // grayscale and for red/green colour blindness.
              style={{ height: getLiveOutcomeBarHeight(outcome) }}
            />
            <TooltipContent>
              <p className='text-xs'>
                {liveOutcomeLabel(t, outcome)}
                {reasonLabel ? ` · ${reasonLabel}` : ''} ·{' '}
                {formatLatency(sample.latency_ms)}
              </p>
            </TooltipContent>
          </Tooltip>
        )
      })}
    </div>
  )
}

export function LiveStatusPanel() {
  const { t } = useTranslation()
  const prefersReducedMotion = useReducedMotion()

  const liveQuery = useQuery({
    queryKey: ['perf-metrics-live'],
    queryFn: getPerfMetricsLive,
    refetchInterval: POLL_INTERVAL_MS,
    // Keep polling while the tab is backgrounded off, so the panel is never
    // showing a stale number the user believes is current.
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: false,
  })

  const live = liveQuery.data?.data
  const samples = useMemo(
    () => (live?.samples ?? []).slice(-VISIBLE_SAMPLES),
    [live?.samples]
  )

  // -1 is the backend's "no requests recorded" marker; NaN maps to the grey
  // unknown state in the shared threshold helpers.
  const successRate =
    live && live.success_rate >= 0 ? live.success_rate : Number.NaN
  const level = getSuccessRateLevel(successRate)
  const hasData = level !== 'unknown'

  const avgLatency = useMemo(() => {
    if (samples.length === 0) return Number.NaN
    const total = samples.reduce((sum, s) => sum + s.latency_ms, 0)
    return total / samples.length
  }, [samples])

  if (liveQuery.isLoading) {
    return (
      <div className='rounded-xl border p-5'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='mt-4 h-10 w-full' />
        <Skeleton className='mt-3 h-8 w-full' />
      </div>
    )
  }

  if (liveQuery.isError) {
    return (
      <div className='rounded-xl border p-5'>
        <div className='flex items-center gap-2'>
          <IconBadge tone='neutral'>
            <Activity className='size-4' />
          </IconBadge>
          <h3 className='text-sm font-semibold'>{t('Live service status')}</h3>
        </div>
        <p className='text-muted-foreground mt-3 text-sm'>
          {t('Live metrics are unavailable right now.')}
        </p>
      </div>
    )
  }

  return (
    <div className='rounded-xl border p-5'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex items-center gap-2'>
          <IconBadge tone={hasData ? 'success' : 'neutral'}>
            <Activity className='size-4' />
          </IconBadge>
          <div>
            <h3 className='flex items-center gap-1.5 text-sm font-semibold'>
              {t('Live service status')}
              <Tooltip>
                <TooltipTrigger
                  aria-label={t('Metric legend')}
                  className='text-muted-foreground hover:text-foreground'
                >
                  <Info className='size-3.5' />
                </TooltipTrigger>
                <TooltipContent className='max-w-xs'>
                  <LiveStatusLegend />
                </TooltipContent>
              </Tooltip>
            </h3>
            <p className='text-muted-foreground text-xs'>
              {t('Refreshed every {{seconds}}s', {
                seconds: POLL_INTERVAL_MS / 1000,
              })}
            </p>
          </div>
        </div>

        {/* Poll-cycle ring: one full sweep per interval. */}
        <div className='relative size-9 shrink-0' aria-hidden='true'>
          <svg className='size-full -rotate-90' viewBox='0 0 36 36'>
            <circle
              className='text-muted/40'
              cx='18'
              cy='18'
              fill='none'
              r='15'
              stroke='currentColor'
              strokeWidth='3'
            />
            <circle
              className={cn(
                'text-emerald-500',
                !prefersReducedMotion && 'live-poll-ring'
              )}
              cx='18'
              cy='18'
              fill='none'
              r='15'
              stroke='currentColor'
              strokeDasharray='94.2'
              strokeLinecap='round'
              strokeWidth='3'
              style={{
                animationDuration: `${POLL_INTERVAL_MS}ms`,
                strokeDashoffset: prefersReducedMotion ? 23.55 : undefined,
              }}
            />
          </svg>
        </div>
      </div>

      <div className='mt-4 grid grid-cols-3 gap-4'>
        <div>
          <div className='flex items-baseline gap-1.5'>
            <span
              className={cn(
                'size-2 rounded-full',
                getSuccessRateDotClass(successRate)
              )}
            />
            <span
              className={cn(
                'text-xl font-semibold tabular-nums',
                getSuccessRateTextClass(successRate)
              )}
            >
              {hasData ? `${successRate.toFixed(1)}%` : '—'}
            </span>
          </div>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            {t('Recent success rate')}
          </p>
        </div>

        <div>
          <span
            className={cn(
              'text-xl font-semibold tabular-nums',
              (live?.in_flight ?? 0) > 0 &&
                'text-emerald-600 dark:text-emerald-400',
              (live?.in_flight ?? 0) > 0 &&
                !prefersReducedMotion &&
                'animate-pulse'
            )}
          >
            {live?.in_flight ?? 0}
          </span>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            {t('In flight')}
          </p>
        </div>

        <div>
          <span className='text-xl font-semibold tabular-nums'>
            {formatLatency(avgLatency)}
          </span>
          <p className='text-muted-foreground mt-0.5 text-xs'>
            {t('Avg latency')}
          </p>
        </div>
      </div>

      {/* Recent request strip, oldest left. */}
      <div className='mt-4'>
        {samples.length === 0 ? (
          <p className='text-muted-foreground border-border/60 rounded-lg border border-dashed px-3 py-3 text-center text-xs'>
            {t('No requests recorded since the last restart.')}
          </p>
        ) : (
          <SampleStrip samples={samples} />
        )}
        <div className='text-muted-foreground mt-2 flex justify-between text-[11px]'>
          <span>{t('Oldest')}</span>
          <span>
            {t('{{count}} requests since restart', {
              count: live?.total_requests ?? 0,
            })}
          </span>
          <span>{t('Newest')}</span>
        </div>
      </div>
    </div>
  )
}
