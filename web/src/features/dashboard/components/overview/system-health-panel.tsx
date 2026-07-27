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
import { Link } from '@tanstack/react-router'
import { Database, HardDrive, Server, Zap } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { IconBadge } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { getSystemHealth } from '@/features/performance-metrics/api'
import { formatLatency } from '@/features/performance-metrics/lib/format'
import type {
  HealthComponent,
  HealthComponentStatus,
} from '@/features/performance-metrics/types'
import { cn } from '@/lib/utils'

const HEALTH_POLL_INTERVAL_MS = 15000

const STATUS_DOT: Record<HealthComponentStatus, string> = {
  ok: 'bg-emerald-500',
  degraded: 'bg-amber-500',
  down: 'bg-red-500',
  disabled: 'bg-muted-foreground',
}

function DependencyRow(props: {
  icon: React.ReactNode
  label: string
  component: HealthComponent
}) {
  const { t } = useTranslation()

  const statusLabel: Record<HealthComponentStatus, string> = {
    ok: t('Reachable'),
    degraded: t('Slow'),
    down: t('Unreachable'),
    disabled: t('Not enabled'),
  }

  const row = (
    <div className='flex items-center justify-between gap-3 py-2'>
      <div className='text-muted-foreground flex items-center gap-2 text-sm'>
        {props.icon}
        <span className='text-foreground'>{props.label}</span>
      </div>
      <div className='flex items-center gap-2'>
        {props.component.status !== 'disabled' && (
          <span className='text-muted-foreground text-xs tabular-nums'>
            {/*
              A local probe can genuinely round to 0ms, which the shared
              formatter renders as "no data". Show sub-millisecond explicitly so
              a fast dependency does not look like a missing measurement.
            */}
            {props.component.latency_ms <= 0
              ? t('<1ms')
              : formatLatency(props.component.latency_ms)}
          </span>
        )}
        <span className='text-xs'>{statusLabel[props.component.status]}</span>
        <span
          className={cn(
            'size-2 shrink-0 rounded-full',
            STATUS_DOT[props.component.status]
          )}
        />
      </div>
    </div>
  )

  // Surface the probe error, which is the only place the actual reason appears.
  if (!props.component.detail) return row
  return (
    <Tooltip>
      <TooltipTrigger className='w-full text-left'>{row}</TooltipTrigger>
      <TooltipContent className='max-w-xs'>
        <p className='text-xs break-words'>{props.component.detail}</p>
      </TooltipContent>
    </Tooltip>
  )
}

export function SystemHealthPanel() {
  const { t } = useTranslation()

  const healthQuery = useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
    refetchInterval: HEALTH_POLL_INTERVAL_MS,
    refetchIntervalInBackground: false,
    retry: false,
  })

  if (healthQuery.isLoading) {
    return (
      <div className='rounded-xl border p-5'>
        <Skeleton className='h-5 w-32' />
        <Skeleton className='mt-4 h-24 w-full' />
      </div>
    )
  }

  const health = healthQuery.data?.data

  if (healthQuery.isError || !health) {
    return (
      <div className='rounded-xl border p-5'>
        <div className='flex items-center gap-2'>
          <IconBadge tone='neutral'>
            <Server className='size-4' />
          </IconBadge>
          <h3 className='text-sm font-semibold'>{t('System health')}</h3>
        </div>
        <p className='text-muted-foreground mt-3 text-sm'>
          {t('Health checks are unavailable right now.')}
        </p>
      </div>
    )
  }

  const { channels } = health
  const disabled = channels.manually_disabled + channels.auto_disabled
  const allDependenciesOk =
    health.database.status === 'ok' &&
    (health.redis.status === 'ok' || health.redis.status === 'disabled')

  return (
    <div className='rounded-xl border p-5'>
      <div className='flex items-center gap-2'>
        <IconBadge tone={allDependenciesOk ? 'success' : 'warning'}>
          <Server className='size-4' />
        </IconBadge>
        <div>
          <h3 className='text-sm font-semibold'>{t('System health')}</h3>
          <p className='text-muted-foreground text-xs'>
            {t('Refreshed every {{seconds}}s', {
              seconds: HEALTH_POLL_INTERVAL_MS / 1000,
            })}
          </p>
        </div>
      </div>

      <div className='divide-border/60 mt-3 divide-y'>
        <DependencyRow
          component={health.database}
          icon={<Database className='size-4' />}
          label={t('Database')}
        />
        <DependencyRow
          component={health.redis}
          icon={<HardDrive className='size-4' />}
          label={t('Redis cache')}
        />
      </div>

      <Link
        className='hover:bg-muted/40 mt-3 flex items-center justify-between gap-3 rounded-lg border px-3 py-2.5 transition-colors'
        to='/channels'
      >
        <div className='flex items-center gap-2 text-sm'>
          <Zap className='text-muted-foreground size-4' />
          <span>{t('Channels')}</span>
        </div>
        <div className='flex items-center gap-3 text-xs'>
          <span className='text-emerald-600 tabular-nums dark:text-emerald-400'>
            {t('{{count}} enabled', { count: channels.enabled })}
          </span>
          {disabled > 0 && (
            <span
              className={cn(
                'tabular-nums',
                channels.auto_disabled > 0
                  ? 'text-red-600 dark:text-red-400'
                  : 'text-muted-foreground'
              )}
            >
              {t('{{count}} disabled', { count: disabled })}
            </span>
          )}
        </div>
      </Link>

      {channels.auto_disabled > 0 && (
        <p className='text-muted-foreground mt-2 text-xs'>
          {t(
            '{{count}} channel(s) were disabled automatically after repeated upstream errors.',
            { count: channels.auto_disabled }
          )}
        </p>
      )}
      {channels.total === 0 && (
        <p className='text-muted-foreground mt-2 text-xs'>
          {t('No channels configured yet, so relay requests cannot succeed.')}
        </p>
      )}
    </div>
  )
}
