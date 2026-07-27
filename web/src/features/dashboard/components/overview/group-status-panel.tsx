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
import { Layers } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Skeleton } from '@/components/ui/skeleton'
import { getPerfMetricsLive } from '@/features/performance-metrics/api'
import { formatLatency } from '@/features/performance-metrics/lib/format'
import { cn } from '@/lib/utils'

import { SampleStrip } from './live-status-panel'

const REFRESH_MS = 3_000

/** Matches the live panel's thresholds so the two never disagree on colour. */
function rateTone(rate: number): string {
  if (rate >= 99) return 'text-emerald-600 dark:text-emerald-400'
  if (rate >= 95) return 'text-amber-600 dark:text-amber-400'
  return 'text-red-600 dark:text-red-400'
}

export function GroupStatusPanel() {
  const { t } = useTranslation()

  const { data, isLoading } = useQuery({
    queryKey: ['perf-metrics-live'],
    queryFn: getPerfMetricsLive,
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: false,
    retry: false,
    staleTime: 0,
  })

  const groups = data?.data?.groups ?? []

  const renderBody = () => {
    if (isLoading) {
      return (
        <div className='space-y-4'>
          {['a', 'b'].map((key) => (
            <div key={key} className='space-y-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-8 w-full' />
            </div>
          ))}
        </div>
      )
    }

    if (groups.length === 0) {
      return (
        <p className='text-muted-foreground border-border/60 rounded-lg border border-dashed px-3 py-6 text-center text-xs'>
          {t('No group traffic recorded since the last restart.')}
        </p>
      )
    }

    return (
      <div className='space-y-4'>
        {groups.map((group) => (
          <div key={group.group}>
            <div className='mb-1.5 flex items-baseline justify-between gap-2'>
              <span className='truncate text-sm font-medium'>
                {group.group}
              </span>
              <span className='text-muted-foreground shrink-0 text-xs tabular-nums'>
                <span
                  className={cn('font-medium', rateTone(group.success_rate))}
                >
                  {group.success_rate.toFixed(1)}%
                </span>
                {' \u00b7 '}
                {formatLatency(group.avg_latency_ms)}
                {' \u00b7 '}
                {t('{{count}} req', { count: group.samples.length })}
              </span>
            </div>
            <SampleStrip samples={group.samples} />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className='bg-card rounded-xl border p-4 sm:p-5'>
      <div className='mb-4 flex items-center gap-2'>
        <div className='bg-primary/10 text-primary flex size-8 items-center justify-center rounded-lg'>
          <Layers className='size-4' />
        </div>
        <div>
          <h3 className='text-sm font-semibold'>{t('Groups')}</h3>
          <p className='text-muted-foreground text-xs'>
            {t('Recent requests per group')}
          </p>
        </div>
      </div>

      {renderBody()}
    </div>
  )
}
