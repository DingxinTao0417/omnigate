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
import { useNavigate } from '@tanstack/react-router'
import { useLayoutEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'

import { Markdown } from '@/components/ui/markdown'
import { cn } from '@/lib/utils'

import type { DocHeading } from '../types'

type DocContentProps = {
  markdown: string
  headings: DocHeading[]
}

export function DocContent(props: DocContentProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const hostRef = useRef<HTMLDivElement>(null)
  const headingsRef = useRef(props.headings)
  headingsRef.current = props.headings

  // The shared Markdown renderer writes raw HTML via dangerouslySetInnerHTML, so
  // heading anchors and copy buttons have to be grafted on afterwards. React can
  // replace that subtree on any later commit, which drops the decorations; a
  // MutationObserver reapplies them. Every step below is idempotent.
  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return

    const copyLabel = t('Copy code')
    const copiedLabel = t('Copied!')

    const decorate = () => {
      const anchors = headingsRef.current
      let index = 0
      host.querySelectorAll('h2, h3').forEach((node) => {
        const heading = anchors[index]
        index += 1
        if (heading && node.id !== heading.id) {
          node.id = heading.id
        }
        node.classList.add('scroll-mt-24')
      })

      host.querySelectorAll('a[href]').forEach((node) => {
        if ((node.getAttribute('href') ?? '').startsWith('/')) {
          node.removeAttribute('target')
          node.removeAttribute('rel')
        }
      })

      host.querySelectorAll('pre').forEach((pre) => {
        if (pre.querySelector('[data-doc-copy]')) return

        pre.classList.add('relative', 'group/code')
        const button = document.createElement('button')
        button.type = 'button'
        button.dataset.docCopy = 'true'
        button.textContent = copyLabel
        button.setAttribute('aria-label', copyLabel)
        button.className =
          'absolute top-2 right-2 rounded-md border bg-background/90 px-2 py-1 text-[11px] font-medium text-muted-foreground opacity-0 transition-opacity hover:text-foreground focus-visible:opacity-100 group-hover/code:opacity-100'
        button.addEventListener('click', () => {
          const code = pre.querySelector('code')?.textContent ?? ''
          void navigator.clipboard?.writeText(code).then(() => {
            button.textContent = copiedLabel
            window.setTimeout(() => {
              button.textContent = copyLabel
            }, 1500)
          })
        })
        pre.append(button)
      })
    }

    decorate()

    const observer = new MutationObserver(() => {
      observer.disconnect()
      decorate()
      observer.observe(host, { childList: true, subtree: true })
    })
    observer.observe(host, { childList: true, subtree: true })

    return () => observer.disconnect()
  }, [props.markdown, t])

  // Intercept in-app links so markdown can reference console pages directly.
  const handleClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const anchor = (event.target as HTMLElement).closest('a')
    if (!anchor) return

    const href = anchor.getAttribute('href') ?? ''
    if (!href.startsWith('/')) return
    if (event.metaKey || event.ctrlKey || event.shiftKey) return

    event.preventDefault()
    void navigate({ to: href })
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events
    <div onClick={handleClick} ref={hostRef}>
      <Markdown
        className={cn(
          'prose-neutral dark:prose-invert max-w-none',
          // Tables are already their own horizontal scroller (see the shared
          // Markdown component). Keep headers on one line, but do NOT set a
          // min-width — that pushes the table past its container on mobile.
          '[&_th]:whitespace-nowrap',
          '[&_h1]:mb-3 [&_h1]:text-3xl [&_h1]:tracking-tight',
          '[&_h2]:mt-10 [&_h2]:border-t [&_h2]:pt-6',
          '[&_pre]:text-[13px]'
        )}
      >
        {props.markdown}
      </Markdown>
    </div>
  )
}
