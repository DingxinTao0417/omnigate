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

import { FETCH_ENDPOINT, SUBMIT_ENDPOINT } from './constants'
import type {
  GenerationParams,
  TaskFetchResponse,
  TaskSubmitResponse,
} from './types'

/** Submits a generation task and returns its id for polling. */
export async function submitImageTask(
  params: GenerationParams,
  signal?: AbortSignal
): Promise<string> {
  const payload = {
    model: params.model,
    prompt: params.prompt,
    ...(params.size !== 'auto' && { size: params.size }),
    metadata: {
      ...(params.resolution !== 'auto' && { resolution: params.resolution }),
      ...(params.quality !== 'auto' && { quality: params.quality }),
      ...(params.count > 1 && { n: params.count }),
    },
  }

  const res = await api.post(SUBMIT_ENDPOINT, payload, {
    signal,
    skipErrorHandler: true,
  } as Record<string, unknown>)

  const data = res.data as TaskSubmitResponse
  const taskId = data.task_id || data.id
  if (!taskId) {
    throw new Error('The response did not include a task id')
  }
  return taskId
}

export async function fetchImageTask(
  taskId: string,
  signal?: AbortSignal
): Promise<TaskFetchResponse> {
  const res = await api.get(`${FETCH_ENDPOINT}/${taskId}`, {
    signal,
    skipErrorHandler: true,
  } as Record<string, unknown>)
  return res.data
}
