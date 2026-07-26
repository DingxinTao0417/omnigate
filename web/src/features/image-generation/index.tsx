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
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'

import { GenerationForm } from './components/generation-form'
import { ImageGallery } from './components/image-gallery'
import { DEFAULT_IMAGE_MODEL } from './constants'
import { useImageGeneration, useImageModels } from './hooks'

export function ImageGeneration() {
  const { t } = useTranslation()
  const { models, isLoading: isLoadingModels } = useImageModels()
  const { images, isGenerating, generate, stop, clear } = useImageGeneration()

  const [prompt, setPrompt] = useState('')
  const [model, setModel] = useState('')
  const [size, setSize] = useState('auto')
  const [quality, setQuality] = useState('auto')
  const [count, setCount] = useState(1)

  // Pick a starting model once the list arrives, preferring the configured
  // default when the user actually has access to it.
  useEffect(() => {
    if (model || !models.length) return
    setModel(
      models.includes(DEFAULT_IMAGE_MODEL) ? DEFAULT_IMAGE_MODEL : models[0]
    )
  }, [model, models])

  const handleSubmit = () => {
    generate({ model, prompt, n: count, size, quality })
  }

  return (
    <div className='flex size-full min-h-0 flex-col lg:flex-row'>
      <aside className='bg-card w-full shrink-0 border-b p-4 lg:w-80 lg:border-e lg:border-b-0'>
        <h1 className='mb-4 text-lg font-medium'>{t('Image Generation')}</h1>
        <GenerationForm
          prompt={prompt}
          model={model}
          size={size}
          quality={quality}
          count={count}
          models={models}
          isLoadingModels={isLoadingModels}
          isGenerating={isGenerating}
          onPromptChange={setPrompt}
          onModelChange={setModel}
          onSizeChange={setSize}
          onQualityChange={setQuality}
          onCountChange={setCount}
          onSubmit={handleSubmit}
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
