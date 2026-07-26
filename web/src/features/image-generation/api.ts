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

import { IMAGE_API_ENDPOINT } from './constants'
import type { ImageGenerationRequest, ImageGenerationResponse } from './types'

export async function generateImages(
  payload: ImageGenerationRequest,
  signal?: AbortSignal
): Promise<ImageGenerationResponse> {
  const body: Record<string, unknown> = {
    model: payload.model,
    prompt: payload.prompt,
    n: payload.n,
  }
  // "auto" is the UI default; the upstream default applies when omitted.
  if (payload.size && payload.size !== 'auto') {
    body.size = payload.size
  }
  if (payload.quality && payload.quality !== 'auto') {
    body.quality = payload.quality
  }

  const res = await api.post(IMAGE_API_ENDPOINT, body, {
    signal,
    skipErrorHandler: true,
  } as Record<string, unknown>)
  return res.data
}
