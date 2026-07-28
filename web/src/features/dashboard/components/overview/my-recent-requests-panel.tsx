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
import { ClipboardList, Copy, RefreshCw } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { CopyButton } from '@/components/copy-button'
import { Button } from '@/components/ui/button'
import { IconBadge } from '@/components/ui/icon-badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import {
  getMyRecentRequests,
  type RecentRelayRequest,
} from '@/features/dashboard/api/recent-requests'
import {
  requestOutcomeDotClass,
  requestOutcomeLabel,
  requestReasonLabel,
  type RequestOutcome,
} from '@/features/dashboard/lib/request-outcome'
import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard'
import dayjs from '@/lib/dayjs'
import { cn } from '@/lib/utils'

const REFRESH_MS = 10_000
const RECENT_LIMIT = 30

function normalizeOutcome(raw: string | undefined): RequestOutcome {
  if (raw === 'failed' || raw === 'partial' || raw === 'success') return raw
  return 'success'
}

/** Build a support-friendly plain-text blob for one request. */
export function formatRequestDiagnostics(item: RecentRelayRequest): string {
  const outcome = normalizeOutcome(item.outcome)
  const lines = [
    `time: ${dayjs.unix(item.created_at).format('YYYY-MM-DD HH:mm:ss')}`,
    `request_id: ${item.request_id || '—'}`,
    `model: ${item.model_name || '—'}`,
    `token: ${item.token_name || '—'}`,
    `outcome: ${outcome}`,
  ]
  if (item.reason) lines.push(`reason: ${item.reason}`)
  if (item.group) lines.push(`group: ${item.group}`)
  lines.push(`stream: ${item.is_stream ? 'true' : 'false'}`)
  lines.push(`latency_s: ${item.use_time}`)
  lines.push(
    `tokens: prompt=${item.prompt_tokens} completion=${item.completion_tokens}`
  )
  lines.push(`quota: ${item.quota}`)
  if (item.message) lines.push(`message: ${item.message}`)
  return lines.join('\n')
}

function RequestRow(props: { item: RecentRelayRequest }) {
  const { t } = useTranslation()
  const item = props.item
  const outcome = normalizeOutcome(item.outcome)
  const reasonLabel = requestReasonLabel(t, item.reason)
  const diagnostics = formatRequestDiagnostics(item)

  return (
    <div className='hover:bg-muted/40 flex items-start gap-2 rounded-lg px-2 py-2 transition-colors'>
      <span
        className={cn(
          'mt-1.5 size-2 shrink-0 rounded-full',
          requestOutcomeDotClass(outcome)
        )}
        aria-hidden='true'
      />
      <div className='min-w-0 flex-1'>
        <div className='flex flex-wrap items-baseline gap-x-2 gap-y-0.5'>
          <span className='truncate font-mono text-xs font-medium'>
            {item.model_name || t('Unknown model')}
          </span>
          <span className='text-muted-foreground text-[11px]'>
            {requestOutcomeLabel(t, outcome)}
            {reasonLabel ? ` · ${reasonLabel}` : ''}
          </span>
        </div>
        <div className='text-muted-foreground mt-0.5 flex flex-wrap gap-x-2 text-[11px]'>
          <span>{dayjs.unix(item.created_at).format('MM-DD HH:mm:ss')}</span>
          {item.use_time > 0 && <span>{item.use_time}s</span>}
          {item.token_name && (
            <span className='max-w-[8rem] truncate' title={item.token_name}>
              {item.token_name}
            </span>
          )}
          {item.request_id && (
            <span className='max-w-[10rem] truncate font-mono' title={item.request_id}>
              {item.request_id}
            </span>
          )}
        </div>
        {item.message && (
          <p className='text-muted-foreground mt-1 line-clamp-2 text-[11px]'>
            {item.message}
          </p>
        )}
      </div>
      <CopyButton
        value={diagnostics}
        size='icon'
        variant='ghost'
        className='size-7 shrink-0'
        tooltip={t('Copy diagnostics')}
        successTooltip={t('Copied')}
      />
    </div>
  )
}

export function MyRecentRequestsPanel() {
  const { t } = useTranslation()
  const { copyToClipboard } = useCopyToClipboard()

  const query = useQuery({
    queryKey: ['my-recent-requests', RECENT_LIMIT],
    queryFn: () => getMyRecentRequests(RECENT_LIMIT),
    refetchInterval: REFRESH_MS,
    refetchIntervalInBackground: false,
    staleTime: 0,
    retry: false,
  })

  const items = query.data?.data?.items ?? []

  const copyAll = async () => {
    if (items.length === 0) return
    const blob = items
      .map((item, index) => `#${index + 1}\n${formatRequestDiagnostics(item)}`)
      .join('\n\n')
    const ok = await copyToClipboard(blob)
    if (ok) toast.success(t('Copied'))
    else toast.error(t('Copy failed'))
  }

  return (
    <section className='bg-card overflow-hidden rounded-2xl border shadow-xs'>
      <div className='flex items-center gap-2 border-b px-4 py-3 sm:px-5'>
        <IconBadge tone='info' size='sm'>
          <ClipboardList />
        </IconBadge>
        <div className='min-w-0 flex-1'>
          <h3 className='text-sm font-semibold'>{t('My recent requests')}</h3>
          <p className='text-muted-foreground text-xs'>
            {t('Your latest API calls for debugging and support')}
          </p>
        </div>
        <div className='flex shrink-0 items-center gap-1'>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='size-8'
                  disabled={items.length === 0}
                  onClick={() => void copyAll()}
                  aria-label={t('Copy all diagnostics')}
                >
                  <Copy className='size-3.5' />
                </Button>
              }
            />
            <TooltipContent>{t('Copy all diagnostics')}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='size-8'
                  disabled={query.isFetching}
                  onClick={() => void query.refetch()}
                  aria-label={t('Refresh')}
                >
                  <RefreshCw
                    className={cn(
                      'size-3.5',
                      query.isFetching && 'animate-spin'
                    )}
                  />
                </Button>
              }
            />
            <TooltipContent>{t('Refresh')}</TooltipContent>
          </Tooltip>
        </div>
      </div>

      <div className='max-h-[22rem] overflow-y-auto px-2 py-1 sm:px-3'>
        {query.isLoading ? (
          <div className='space-y-2 p-2'>
            {['a', 'b', 'c', 'd'].map((key) => (
              <Skeleton key={key} className='h-12 w-full rounded-lg' />
            ))}
          </div>
        ) : query.isError ? (
          <p className='text-muted-foreground px-3 py-6 text-center text-xs'>
            {t('Recent requests are unavailable right now.')}
          </p>
        ) : items.length === 0 ? (
          <p className='text-muted-foreground border-border/60 m-2 rounded-lg border border-dashed px-3 py-6 text-center text-xs'>
            {t('No API requests yet. Make a call with your key to see it here.')}
          </p>
        ) : (
          <div className='divide-border/50 divide-y'>
            {items.map((item) => (
              <RequestRow
                key={`${item.request_id}-${item.created_at}-${item.model_name}`}
                item={item}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
