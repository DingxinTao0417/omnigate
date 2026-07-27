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
import { ROLE } from '@/lib/roles'
import { useAuthStore } from '@/stores/auth-store'

import { GroupStatusPanel } from './overview/group-status-panel'
import { LiveStatusPanel } from './overview/live-status-panel'
import { PerformanceHealthPanel } from './overview/performance-health-panel'
import { SystemHealthPanel } from './overview/system-health-panel'

/**
 * Realtime service status. The live and group panels are open to every
 * signed-in user; the dependency and per-model panels stay admin-only because
 * they expose infrastructure reachability and cross-tenant model performance.
 */
export function ServiceStatusDashboard() {
  const userRole = useAuthStore((state) => state.auth.user?.role)
  const isAdmin = Boolean(userRole && userRole >= ROLE.ADMIN)

  return (
    <div className='space-y-3 sm:space-y-4'>
      <div className='grid gap-3 sm:gap-4 lg:grid-cols-2'>
        <LiveStatusPanel />
        {isAdmin && <SystemHealthPanel />}
      </div>
      <GroupStatusPanel />
      {isAdmin && <PerformanceHealthPanel />}
    </div>
  )
}
