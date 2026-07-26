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

export interface ImageModelCapability {
  maxCount: number
  supportsQuality: boolean
  resolutions: string[]
  ratios: string[]
}

export interface GenerationParams {
  model: string
  prompt: string
  size: string
  resolution: string
  quality: string
  count: number
}

/** Submit payload; extras travel in metadata like other task platforms. */
export interface TaskSubmitPayload {
  model: string
  prompt: string
  size?: string
  metadata: {
    resolution?: string
    quality?: string
    n?: number
  }
}

export interface TaskSubmitResponse {
  task_id?: string
  id?: string
}

export interface TaskFetchResponse {
  code?: string
  data?: {
    task_id?: string
    status?: string
    progress?: string
    fail_reason?: string
    result_url?: string
  } | null
}

export interface GalleryImage {
  id: string
  src: string
  prompt: string
  model: string
  createdAt: number
}
