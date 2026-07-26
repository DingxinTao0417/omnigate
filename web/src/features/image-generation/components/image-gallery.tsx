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
import { Download, ImageIcon } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'

import type { GalleryImage } from '../types'

function triggerDownload(href: string, name: string) {
  const link = document.createElement('a')
  link.href = href
  link.download = name
  link.rel = 'noopener'
  document.body.append(link)
  link.click()
  link.remove()
}

interface ImageGalleryProps {
  images: GalleryImage[]
  isGenerating: boolean
}

export function ImageGallery(props: ImageGalleryProps) {
  const { t } = useTranslation()

  // The download attribute is ignored for cross-origin URLs, so fetch the bytes
  // and hand the browser a blob it will actually save.
  const handleDownload = async (image: GalleryImage) => {
    const name = `omnigate-${image.model}-${image.createdAt}.png`
    try {
      const res = await fetch(image.src)
      const blob = await res.blob()
      const href = URL.createObjectURL(blob)
      triggerDownload(href, name)
      URL.revokeObjectURL(href)
    } catch {
      // Falling back to a new tab still lets the user save it manually.
      window.open(image.src, '_blank', 'noopener')
    }
  }

  if (!props.images.length) {
    return (
      <div className='text-muted-foreground flex h-full flex-col items-center justify-center gap-3 p-8 text-center'>
        <ImageIcon className='size-10 opacity-40' />
        <p className='text-sm'>
          {props.isGenerating
            ? t('Generating, this may take a while')
            : t('Generated images will appear here')}
        </p>
      </div>
    )
  }

  return (
    <div className='grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 xl:grid-cols-3'>
      {props.images.map((image) => (
        <figure
          key={image.id}
          className='group bg-muted/30 relative overflow-hidden rounded-lg border'
        >
          <img
            src={image.src}
            alt={image.prompt}
            loading='lazy'
            className='aspect-square w-full object-cover'
          />
          <figcaption className='flex items-start justify-between gap-2 p-3'>
            <div className='min-w-0 flex-1'>
              <p className='truncate text-xs font-medium'>{image.model}</p>
              <p className='text-muted-foreground line-clamp-2 text-xs'>
                {image.prompt}
              </p>
            </div>
            <Button
              variant='ghost'
              size='icon'
              className='size-7 shrink-0'
              onClick={() => handleDownload(image)}
              aria-label={t('Download')}
            >
              <Download className='size-4' />
            </Button>
          </figcaption>
        </figure>
      ))}
    </div>
  )
}
