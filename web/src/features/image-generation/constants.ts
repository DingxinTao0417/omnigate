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

export const IMAGE_API_ENDPOINT = '/pg/images/generations'

// Models whose names suggest image output; used to pre-filter the user's
// model list. Falls back to the full list when nothing matches.
export const IMAGE_MODEL_PATTERN =
  /image|dall-e|flux|imagen|seedream|cogview|janus|photon|recraft/i

// Size values follow the OpenAI images API. Ratios are shown verbatim since
// they read the same in every language; only "auto" needs translating.
export const SIZE_OPTIONS = [
  { value: 'auto', ratio: null },
  { value: '1024x1024', ratio: '1:1' },
  { value: '1536x1024', ratio: '3:2' },
  { value: '1024x1536', ratio: '2:3' },
  { value: '1792x1024', ratio: '16:9' },
  { value: '1024x1792', ratio: '9:16' },
] as const

export const QUALITY_OPTIONS = [
  { value: 'auto', labelKey: 'Auto' },
  { value: 'low', labelKey: 'Low' },
  { value: 'medium', labelKey: 'Medium' },
  { value: 'high', labelKey: 'High' },
] as const

export const COUNT_OPTIONS = [1, 2, 3, 4] as const

export const DEFAULT_IMAGE_MODEL = 'gpt-image-2'
