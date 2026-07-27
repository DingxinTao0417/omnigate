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
import { Link } from '@tanstack/react-router'
import { Search, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

import { DOC_GROUPS } from '../content'
import { toSearchText } from '../lib/markdown'
import type { DocContext } from '../types'

type DocSidebarProps = {
  activeSlug: string
  context: DocContext
  onNavigate?: () => void
}

export function DocSidebar(props: DocSidebarProps) {
  const { t } = useTranslation()
  const [query, setQuery] = useState('')
  const navRef = useRef<HTMLElement>(null)
  const [canScroll, setCanScroll] = useState(false)

  const searchIndex = useMemo(
    () =>
      DOC_GROUPS.flatMap((group) =>
        group.chapters.map((chapter) => ({
          slug: chapter.slug,
          haystack: [
            chapter.title,
            chapter.summary,
            chapter.keywords.join(' '),
            toSearchText(chapter.build(props.context)),
          ]
            .join(' ')
            .toLowerCase(),
        }))
      ),
    [props.context]
  )

  const matchedSlugs = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (!needle) return null
    return new Set(
      searchIndex
        .filter((entry) => entry.haystack.includes(needle))
        .map((entry) => entry.slug)
    )
  }, [query, searchIndex])

  const visibleGroups = DOC_GROUPS.map((group) => ({
    ...group,
    chapters: matchedSlugs
      ? group.chapters.filter((chapter) => matchedSlugs.has(chapter.slug))
      : group.chapters,
  })).filter((group) => group.chapters.length > 0)

  // Re-measure after filtering changes the list length.
  useLayoutEffect(() => {
    const el = navRef.current
    if (!el) return
    setCanScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 8)
  }, [visibleGroups.length, query])

  // ...and when the window height changes.
  useEffect(() => {
    const el = navRef.current
    if (!el) return

    const measure = () =>
      setCanScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 8)
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    // Search is a fixed-size flex row; only the chapter list below it scrolls,
    // so the input can never overlap a chapter link.
    <div className='flex h-full min-h-0 flex-col gap-4'>
      <div className='shrink-0'>
        <div className='relative'>
          <Search
            aria-hidden='true'
            className='text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2'
          />
          <Input
            aria-label={t('Search documentation')}
            className='h-9 pr-8 pl-8 text-sm'
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t('Search documentation')}
            type='search'
            value={query}
          />
          {query && (
            <Button
              aria-label={t('Clear search')}
              className='absolute top-1/2 right-1 size-7 -translate-y-1/2'
              onClick={() => setQuery('')}
              size='icon'
              variant='ghost'
            >
              <X className='size-3.5' />
            </Button>
          )}
        </div>
      </div>

      {visibleGroups.length === 0 && (
        <p className='text-muted-foreground px-1 text-sm'>
          {t('No matching documentation found.')}
        </p>
      )}

      {/*
        hover-scrollbar keeps a real scrollbar available (the global
        `scrollbar-gutter: stable` otherwise leaves this list looking
        unscrollable), and the wrapper below fades the last row so it is
        visibly cut off rather than appearing to be the end of the list.
      */}
      <div className='relative flex min-h-0 flex-1 flex-col'>
        <nav
          aria-label={t('Docs')}
          className='hover-scrollbar flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pr-1 pb-6'
          onScroll={(event) => {
            const el = event.currentTarget
            setCanScroll(el.scrollHeight - el.scrollTop - el.clientHeight > 8)
          }}
          ref={navRef}
        >
          {visibleGroups.map((group) => (
            <div className='flex flex-col gap-1' key={group.id}>
              <span className='text-muted-foreground/70 px-2 text-[10px] font-bold tracking-[0.12em] uppercase'>
                {t(group.titleKey)}
              </span>
              {group.chapters.map((chapter) => {
                const isActive = chapter.slug === props.activeSlug
                return (
                  <Link
                    className={cn(
                      'rounded-md px-2 py-1.5 text-sm transition-colors',
                      isActive
                        ? 'bg-muted text-foreground font-medium'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                    )}
                    key={chapter.slug}
                    onClick={props.onNavigate}
                    params={{ slug: chapter.slug }}
                    to='/docs/$slug'
                  >
                    {chapter.title}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        {/* Fades the clipped row so a cut-off list does not read as its end. */}
        {canScroll && (
          <div
            aria-hidden='true'
            className='from-background pointer-events-none absolute inset-x-0 bottom-0 h-8 bg-linear-to-t to-transparent'
          />
        )}
      </div>
    </div>
  )
}
