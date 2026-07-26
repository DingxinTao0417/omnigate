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
import { useCallback, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { generateImages } from '../api'
import type { GalleryImage, ImageGenerationRequest } from '../types'

/** Pulls a human-readable message out of an axios/relay error shape. */
function extractErrorMessage(error: unknown, fallback: string): string {
  const res = (error as { response?: { data?: unknown } })?.response?.data
  const err = (res as { error?: unknown })?.error
  const message =
    (err as { message?: string })?.message ??
    (res as { message?: string })?.message ??
    (error as { message?: string })?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}

export function useImageGeneration() {
  const { t } = useTranslation()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsGenerating(false)
  }, [])

  const generate = useCallback(
    async (request: ImageGenerationRequest) => {
      if (!request.prompt.trim()) {
        toast.error(t('Please enter a prompt'))
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      setIsGenerating(true)

      try {
        const data = await generateImages(request, controller.signal)
        const results = (data.data ?? [])
          .map((item, index) => {
            const src = item.b64_json
              ? `data:image/png;base64,${item.b64_json}`
              : item.url
            if (!src) return null
            return {
              // Index keeps ids unique when several images share a timestamp.
              id: `${data.created ?? ''}-${index}-${src.slice(-16)}`,
              src,
              prompt: item.revised_prompt || request.prompt,
              model: request.model,
              createdAt: (data.created ?? 0) * 1000 || Date.now(),
            } satisfies GalleryImage
          })
          .filter((item): item is GalleryImage => item !== null)

        if (!results.length) {
          toast.error(t('The response contained no images'))
          return
        }
        setImages((prev) => [...results, ...prev])
      } catch (error) {
        if (controller.signal.aborted) return
        toast.error(extractErrorMessage(error, t('Image generation failed')))
      } finally {
        abortRef.current = null
        setIsGenerating(false)
      }
    },
    [t]
  )

  const clear = useCallback(() => setImages([]), [])

  return { images, isGenerating, generate, stop, clear }
}
