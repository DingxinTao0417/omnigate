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

import { COUNT_OPTIONS, QUALITY_OPTIONS, SIZE_OPTIONS } from '../constants'

interface GenerationFormProps {
  prompt: string
  model: string
  size: string
  quality: string
  count: number
  models: string[]
  isLoadingModels: boolean
  isGenerating: boolean
  onPromptChange: (value: string) => void
  onModelChange: (value: string) => void
  onSizeChange: (value: string) => void
  onQualityChange: (value: string) => void
  onCountChange: (value: number) => void
  onSubmit: () => void
  onStop: () => void
}

export function GenerationForm(props: GenerationFormProps) {
  const { t } = useTranslation()

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
          value={props.prompt}
          onChange={(event) => props.onPromptChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={t('Describe the image you want to generate')}
          rows={6}
          className='resize-none'
        />
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='image-model'>{t('Model')}</Label>
        <Select
          value={props.model}
          onValueChange={(value) => props.onModelChange(value ?? '')}
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
          <Label htmlFor='image-size'>{t('Aspect ratio')}</Label>
          <Select
            value={props.size}
            onValueChange={(value) => props.onSizeChange(value ?? 'auto')}
          >
            <SelectTrigger id='image-size'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SIZE_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.ratio ?? t('Auto')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className='flex flex-col gap-2'>
          <Label htmlFor='image-quality'>{t('Quality')}</Label>
          <Select
            value={props.quality}
            onValueChange={(value) => props.onQualityChange(value ?? 'auto')}
          >
            <SelectTrigger id='image-quality'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {QUALITY_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className='flex flex-col gap-2'>
        <Label htmlFor='image-count'>{t('Number of images')}</Label>
        <Select
          value={String(props.count)}
          onValueChange={(value) => props.onCountChange(Number(value ?? 1))}
        >
          <SelectTrigger id='image-count'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {COUNT_OPTIONS.map((value) => (
              <SelectItem key={value} value={String(value)}>
                {value}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {props.isGenerating ? (
        <Button variant='outline' onClick={props.onStop} className='w-full'>
          <Square className='size-4' />
          {t('Stop')}
        </Button>
      ) : (
        <Button
          onClick={props.onSubmit}
          disabled={!props.prompt.trim() || !props.model}
          className='w-full'
        >
          <ImagePlus className='size-4' />
          {t('Generate')}
        </Button>
      )}

      {props.isGenerating && (
        <div className='text-muted-foreground flex items-center justify-center gap-2 text-sm'>
          <Spinner className='size-4' />
          {t('Generating, this may take a while')}
        </div>
      )}
    </div>
  )
}
