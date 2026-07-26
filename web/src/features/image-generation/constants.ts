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
import type { ImageModelCapability } from './types'

export const SUBMIT_ENDPOINT = '/pg/images/tasks'
export const FETCH_ENDPOINT = '/pg/images/tasks'

export const POLL_INTERVAL_MS = 3000
// Upstream generation can legitimately take minutes; give up rather than poll
// forever if a task never reaches a terminal state.
export const POLL_TIMEOUT_MS = 5 * 60 * 1000

export const IMAGE_MODEL_PATTERN =
  /image|dall-e|flux|imagen|seedream|seedance|banana|gemini-.*-image|cogview|grok-imagine|recraft/i

export const DEFAULT_IMAGE_MODEL = 'gpt-image-2'

/**
 * Per-model limits. Values mirror the upstream documentation; a model that is
 * absent falls back to DEFAULT_CAPABILITY so an unlisted model stays usable.
 */
export const MODEL_CAPABILITIES: Record<string, ImageModelCapability> = {
  'gpt-image-2': {
    maxCount: 1,
    supportsQuality: false,
    resolutions: ['1k', '2k', '4k'],
    ratios: [
      '1:1',
      '16:9',
      '9:16',
      '2:1',
      '1:2',
      '4:3',
      '3:4',
      '3:2',
      '2:3',
      '21:9',
      '9:21',
      '5:4',
      '4:5',
    ],
  },
  'gpt-image-2-official': {
    maxCount: 4,
    supportsQuality: true,
    resolutions: ['1k', '2k', '4k'],
    ratios: [
      '1:1',
      '16:9',
      '9:16',
      '2:1',
      '1:2',
      '4:3',
      '3:4',
      '3:2',
      '2:3',
      '21:9',
      '9:21',
      '5:4',
      '4:5',
    ],
  },
}

export const DEFAULT_CAPABILITY: ImageModelCapability = {
  maxCount: 1,
  supportsQuality: false,
  resolutions: ['1k', '2k'],
  ratios: ['1:1', '16:9', '9:16', '4:3', '3:4'],
}

// 4K output is only accepted for these wide/tall ratios.
export const FOUR_K_RATIOS = ['16:9', '9:16', '2:1', '1:2', '21:9', '9:21']

export const QUALITY_OPTIONS = ['auto', 'low', 'medium', 'high'] as const
