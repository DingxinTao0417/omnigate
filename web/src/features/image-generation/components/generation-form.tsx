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
import { ImagePlus, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Spinner } from '@/components/ui/spinner'
import { Textarea } from '@/components/ui/textarea'

import { FOUR_K_RATIOS, QUALITY_OPTIONS } from '../constants'
import type { GenerationParams, ImageModelCapability } from '../types'

interface GenerationFormProps {
  params: GenerationParams
  capability: ImageModelCapability
  models: string[]
  isLoadingModels: boolean
  isGenerating: boolean
  statusText: string
  onChange: (patch: Partial<GenerationParams>) => void
  onSubmit: () => void
  onStop: () => void
}

export function GenerationForm(props: GenerationFormProps) {
  const { t } = useTranslation()
  const { params, capability } = props

  // 4K is only accepted for the wide and tall ratios, so hide the rest once
  // the user picks it rather than letting upstream reject the request.
  const ratios =
    params.resolution === '4k'
      ? capability.ratios.filter((ratio) => FOUR_K_RATIOS.includes(ratio))
      : capability.ratios

  const counts = Array.from({ length: capability.maxCount }, (_, i) => i + 1)

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault()
      if (!props.isGenerating) props.onSubmit()
    }
  }

  return (
    <div className='flex flex-col gap-4'>
      <div className='flex flex-col gap-2'>
        <Label htmlFor='image-prompt'>{t('Prompt')}</Label>
        <Textarea
          id='image-prompt'
          value={params.prompt}
          onChange={(event) => props.onChange({ prompt: event.target.value })}
          onKeyDown={handleKeyDown}
          placeholder={t('Describe the image you want to generate')}
          rows={6}
          maxLength={2000}
          className='resize-none'
        />
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='image-model'>{t('Model')}</Label>
        <Select
          value={params.model}
          onValueChange={(value) => props.onChange({ model: value ?? '' })}
        >
          <SelectTrigger id='image-model'>
            <SelectValue
              placeholder={
                props.isLoadingModels ? t('Loading...') : t('Select a model')
              }
            />
          </SelectTrigger>
          <SelectContent>
            {props.models.map((name) => (
              <SelectItem key={name} value={name}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        <div className='flex flex-col gap-2'>
          <Label htmlFor='image-ratio'>{t('Aspect ratio')}</Label>
          <Select
            value={params.size}
            onValueChange={(value) => props.onChange({ size: value ?? '1:1' })}
          >
            <SelectTrigger id='image-ratio'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ratios.map((ratio) => (
                <SelectItem key={ratio} value={ratio}>
                  {ratio}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-2'>
          <Label htmlFor='image-resolution'>{t('Resolution')}</Label>
          <Select
            value={params.resolution}
            onValueChange={(value) =>
              props.onChange({ resolution: value ?? '1k' })
            }
          >
            <SelectTrigger id='image-resolution'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {capability.resolutions.map((resolution) => (
                <SelectItem key={resolution} value={resolution}>
                  {resolution.toUpperCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-3'>
        {capability.supportsQuality && (
          <div className='flex flex-col gap-2'>
            <Label htmlFor='image-quality'>{t('Quality')}</Label>
            <Select
              value={params.quality}
              onValueChange={(value) =>
                props.onChange({ quality: value ?? 'auto' })
              }
            >
              <SelectTrigger id='image-quality'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {QUALITY_OPTIONS.map((quality) => (
                  <SelectItem key={quality} value={quality}>
                    {t(qualityLabel(quality))}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        {capability.maxCount > 1 && (
          <div className='flex flex-col gap-2'>
            <Label htmlFor='image-count'>{t('Number of images')}</Label>
            <Select
              value={String(params.count)}
              onValueChange={(value) =>
                props.onChange({ count: Number(value ?? 1) })
              }
            >
              <SelectTrigger id='image-count'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {counts.map((count) => (
                  <SelectItem key={count} value={String(count)}>
                    {count}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {props.isGenerating ? (
        <Button variant='outline' onClick={props.onStop} className='w-full'>
          <Square className='size-4' />
          {t('Stop')}
        </Button>
      ) : (
        <Button
          onClick={props.onSubmit}
          disabled={!params.prompt.trim() || !params.model}
          className='w-full'
        >
          <ImagePlus className='size-4' />
          {t('Generate')}
        </Button>
      )}

      {props.isGenerating && (
        <div className='text-muted-foreground flex items-center justify-center gap-2 text-sm'>
          <Spinner className='size-4' />
          {props.statusText || t('Generating, this may take a while')}
        </div>
      )}
    </div>
  )
}

function qualityLabel(quality: string): string {
  switch (quality) {
    case 'low':
      return 'Low'
    case 'medium':
      return 'Medium'
    case 'high':
      return 'High'
    default:
      return 'Auto'
  }
}
