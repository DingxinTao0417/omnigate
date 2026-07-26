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
import { Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

import { GenerationForm } from './components/generation-form'
import { ImageGallery } from './components/image-gallery'
import {
  DEFAULT_CAPABILITY,
  DEFAULT_IMAGE_MODEL,
  FOUR_K_RATIOS,
  MODEL_CAPABILITIES,
} from './constants'
import { useImageGeneration, useImageModels } from './hooks'
import type { GenerationParams } from './types'

const INITIAL_PARAMS: GenerationParams = {
  model: '',
  prompt: '',
  size: '1:1',
  resolution: '1k',
  quality: 'auto',
  count: 1,
}

export function ImageGeneration() {
  const { t } = useTranslation()
  const { models, isLoading: isLoadingModels } = useImageModels()
  const { images, isGenerating, statusText, generate, stop, clear } =
    useImageGeneration()
  const [params, setParams] = useState<GenerationParams>(INITIAL_PARAMS)

  const capability = useMemo(
    () => MODEL_CAPABILITIES[params.model] ?? DEFAULT_CAPABILITY,
    [params.model]
  )

  useEffect(() => {
    if (params.model || !models.length) return
    setParams((prev) => ({
      ...prev,
      model: models.includes(DEFAULT_IMAGE_MODEL)
        ? DEFAULT_IMAGE_MODEL
        : models[0],
    }))
  }, [params.model, models])

  // Switching models can leave a selection the new model rejects, so pull the
  // affected fields back into its supported range.
  useEffect(() => {
    setParams((prev) => {
      const next = { ...prev }
      if (!capability.resolutions.includes(next.resolution)) {
        next.resolution = capability.resolutions[0]
      }
      const allowed =
        next.resolution === '4k'
          ? capability.ratios.filter((ratio) => FOUR_K_RATIOS.includes(ratio))
          : capability.ratios
      if (allowed.length && !allowed.includes(next.size)) {
        next.size = allowed[0]
      }
      if (next.count > capability.maxCount) {
        next.count = capability.maxCount
      }
      if (!capability.supportsQuality) {
        next.quality = 'auto'
      }
      return next
    })
  }, [capability])

  const handleChange = (patch: Partial<GenerationParams>) =>
    setParams((prev) => ({ ...prev, ...patch }))

  return (
    <div className='flex size-full min-h-0 flex-col lg:flex-row'>
      <aside className='bg-card w-full shrink-0 overflow-y-auto border-b p-4 lg:w-80 lg:border-e lg:border-b-0'>
        <h1 className='mb-4 text-lg font-medium'>{t('Image Generation')}</h1>
        <GenerationForm
          params={params}
          capability={capability}
          models={models}
          isLoadingModels={isLoadingModels}
          isGenerating={isGenerating}
          statusText={statusText}
          onChange={handleChange}
          onSubmit={() => generate(params)}
          onStop={stop}
        />
      </aside>

      <section className='flex min-h-0 flex-1 flex-col'>
        {images.length > 0 && (
          <div className='flex items-center justify-between border-b px-4 py-2'>
            <span className='text-muted-foreground text-sm'>
              {t('Results')} ({images.length})
            </span>
            <Button variant='ghost' size='sm' onClick={clear}>
              <Trash2 className='size-4' />
              {t('Clear')}
            </Button>
          </div>
        )}
        <ScrollArea className='min-h-0 flex-1'>
          <ImageGallery images={images} isGenerating={isGenerating} />
        </ScrollArea>
      </section>
    </div>
  )
}
