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

import { api } from '@/lib/api'

import { IMAGE_MODEL_PATTERN } from '../constants'

/**
 * Available models for the current user, narrowed to image-capable names.
 *
 * The endpoint reports every model the user can reach without saying which
 * produce images, so names are matched heuristically; an empty match falls
 * back to the full list rather than leaving the picker unusable.
 */
export function useImageModels() {
  const query = useQuery({
    queryKey: ['image-generation', 'models'],
    queryFn: async (): Promise<string[]> => {
      const res = await api.get('/api/user/models')
      const { data } = res
      if (!data.success || !Array.isArray(data.data)) return []
      return data.data as string[]
    },
    staleTime: 5 * 60 * 1000,
  })

  const all = query.data ?? []
  const imageModels = all.filter((name) => IMAGE_MODEL_PATTERN.test(name))

  return {
    models: imageModels.length > 0 ? imageModels : all,
    isLoading: query.isLoading,
  }
}
