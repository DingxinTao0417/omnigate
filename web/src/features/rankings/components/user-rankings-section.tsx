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
import { lazy, Suspense, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { getDefaultDays, getSavedGranularity } from '@/features/dashboard/lib'
import type { UserChartsFilters } from '@/features/dashboard/types'

// Charting pulls in VChart, which is large; keep it off the initial rankings
// bundle since most visitors only ever see the model leaderboard.
const LazyUserCharts = lazy(() =>
  import('@/features/dashboard/components/users/user-charts').then((m) => ({
    default: m.UserCharts,
  }))
)

function UserChartsFallback() {
  return (
    <div className='space-y-4'>
      <Skeleton className='h-72 w-full rounded-xl' />
      <Skeleton className='h-72 w-full rounded-xl' />
    </div>
  )
}

/**
 * Admin-only user leaderboard on the rankings page. The underlying data comes
 * from an admin endpoint, so the caller must gate this behind a role check.
 */
export function UserRankingsSection() {
  const [filters, setFilters] = useState<UserChartsFilters>(() => {
    const granularity = getSavedGranularity()
    return {
      timeGranularity: granularity,
      selectedRange: getDefaultDays(granularity),
      topUserLimit: 10,
    }
  })

  return (
    <Suspense fallback={<UserChartsFallback />}>
      <LazyUserCharts filters={filters} onFiltersChange={setFilters} />
    </Suspense>
  )
}
