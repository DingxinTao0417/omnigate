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
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

import type { DocHeading } from '../types'

type DocTocProps = {
  headings: DocHeading[]
}

export function DocToc(props: DocTocProps) {
  const { t } = useTranslation()
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    if (props.headings.length === 0) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) {
          setActiveId(visible[0].target.id)
        }
      },
      { rootMargin: '-96px 0px -70% 0px', threshold: 0 }
    )

    props.headings.forEach((heading) => {
      const node = document.querySelector(`#${CSS.escape(heading.id)}`)
      if (node) observer.observe(node)
    })

    return () => observer.disconnect()
  }, [props.headings])

  if (props.headings.length < 2) return null

  return (
    <nav aria-label={t('On this page')} className='flex flex-col gap-2'>
      <span className='text-muted-foreground/70 text-[10px] font-bold tracking-[0.12em] uppercase'>
        {t('On this page')}
      </span>
      <ul className='flex flex-col gap-0.5 text-sm'>
        {props.headings.map((heading) => (
          <li key={heading.id}>
            <a
              className={cn(
                'block rounded-md py-1 transition-colors',
                heading.level === 3 ? 'pl-5' : 'pl-2',
                heading.id === activeId
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground hover:text-foreground'
              )}
              href={`#${heading.id}`}
            >
              {heading.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
