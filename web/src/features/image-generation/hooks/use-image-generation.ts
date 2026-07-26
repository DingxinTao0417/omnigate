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

import { fetchImageTask, submitImageTask } from '../api'
import { POLL_INTERVAL_MS, POLL_TIMEOUT_MS } from '../constants'
import type { GalleryImage, GenerationParams } from '../types'

const TERMINAL_SUCCESS = new Set(['SUCCESS', 'SUCCEED', 'SUCCEEDED'])
const TERMINAL_FAILURE = new Set(['FAILURE', 'FAILED', 'ERROR', 'UNKNOWN'])

function extractErrorMessage(error: unknown, fallback: string): string {
  const res = (error as { response?: { data?: unknown } })?.response?.data
  const err = (res as { error?: unknown })?.error
  const message =
    (err as { message?: string })?.message ??
    (typeof err === 'string' ? err : undefined) ??
    (res as { message?: string })?.message ??
    (error as { message?: string })?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, ms)
    signal.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Aborted', 'AbortError'))
      },
      { once: true }
    )
  })

export function useImageGeneration() {
  const { t } = useTranslation()
  const [images, setImages] = useState<GalleryImage[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [statusText, setStatusText] = useState('')
  const abortRef = useRef<AbortController | null>(null)

  const stop = useCallback(() => {
    abortRef.current?.abort()
    abortRef.current = null
    setIsGenerating(false)
    setStatusText('')
  }, [])

  const generate = useCallback(
    async (params: GenerationParams) => {
      if (!params.prompt.trim()) {
        toast.error(t('Please enter a prompt'))
        return
      }

      const controller = new AbortController()
      abortRef.current = controller
      setIsGenerating(true)
      setStatusText(t('Submitting task'))

      try {
        const taskId = await submitImageTask(params, controller.signal)
        setStatusText(t('Waiting for the image'))

        const deadline = Date.now() + POLL_TIMEOUT_MS
        // Upstream is asynchronous: poll until the task reaches a terminal
        // state or the deadline passes.
        for (;;) {
          if (Date.now() > deadline) {
            toast.error(t('Timed out waiting for the image'))
            return
          }
          await wait(POLL_INTERVAL_MS, controller.signal)

          const res = await fetchImageTask(taskId, controller.signal)
          const task = res.data
          if (!task) continue

          const status = (task.status || '').toUpperCase()
          if (TERMINAL_FAILURE.has(status)) {
            toast.error(task.fail_reason || t('Image generation failed'))
            return
          }
          if (!TERMINAL_SUCCESS.has(status)) {
            if (task.progress) setStatusText(task.progress)
            continue
          }

          if (!task.result_url) {
            toast.error(t('The response contained no images'))
            return
          }
          setImages((prev) => [
            {
              id: taskId,
              src: task.result_url as string,
              prompt: params.prompt,
              model: params.model,
              createdAt: Date.now(),
            },
            ...prev,
          ])
          return
        }
      } catch (error) {
        if (controller.signal.aborted) return
        toast.error(extractErrorMessage(error, t('Image generation failed')))
      } finally {
        abortRef.current = null
        setIsGenerating(false)
        setStatusText('')
      }
    },
    [t]
  )

  const clear = useCallback(() => setImages([]), [])

  return { images, isGenerating, statusText, generate, stop, clear }
}
