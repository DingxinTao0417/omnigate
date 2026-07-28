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
import { api } from '@/lib/api'

import type { RequestOutcome } from '../lib/request-outcome'

export type RecentRelayRequest = {
  request_id: string
  created_at: number
  type: number
  model_name: string
  token_name: string
  use_time: number
  is_stream: boolean
  quota: number
  prompt_tokens: number
  completion_tokens: number
  outcome: RequestOutcome
  reason?: string
  message?: string
  group?: string
}

export type RecentRelayRequestsData = {
  success: boolean
  message?: string
  data: {
    items: RecentRelayRequest[]
  }
}

export async function getMyRecentRequests(
  limit = 30
): Promise<RecentRelayRequestsData> {
  const res = await api.get<RecentRelayRequestsData>('/api/log/self/recent', {
    params: { limit },
  })
  return res.data
}
