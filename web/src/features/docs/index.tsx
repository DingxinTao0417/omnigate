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
import { Link, useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, ArrowRight, Menu } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet'
import { useStatus } from '@/hooks/use-status'
import { DEFAULT_SYSTEM_NAME, PUBLIC_API_BASE_URL } from '@/lib/constants'

import { DocContent } from './components/doc-content'
import { DocSidebar } from './components/doc-sidebar'
import { DocToc } from './components/doc-toc'
import { DEFAULT_DOC_SLUG, DOC_CHAPTERS, findChapter } from './content'
import { extractHeadings } from './lib/markdown'
import type { DocContext } from './types'

function useDocContext(): DocContext {
  const { status } = useStatus()
  const siteName = (status?.system_name as string | undefined)?.trim()

  // Fixed production URL, not window.location.origin: readers copy these
  // snippets into their own clients, so a localhost/LAN preview must not leak
  // an unusable address into the samples.
  return useMemo(
    () => ({
      baseUrl: PUBLIC_API_BASE_URL,
      siteName: siteName || DEFAULT_SYSTEM_NAME,
    }),
    [siteName]
  )
}

export function Docs() {
  const { t } = useTranslation()
  const params = useParams({ strict: false }) as { slug?: string }
  const context = useDocContext()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const navigate = useNavigate()
  const requestedSlug = params.slug
  const isKnownSlug = !requestedSlug || Boolean(findChapter(requestedSlug))
  const slug = isKnownSlug && requestedSlug ? requestedSlug : DEFAULT_DOC_SLUG
  const chapter = findChapter(slug)

  // Unknown slug: land on the first chapter and keep the URL honest.
  useEffect(() => {
    if (isKnownSlug) return
    void navigate({
      params: { slug: DEFAULT_DOC_SLUG },
      replace: true,
      to: '/docs/$slug',
    })
  }, [isKnownSlug, navigate])
  const markdown = useMemo(
    () => (chapter ? chapter.build(context) : ''),
    [chapter, context]
  )
  const headings = useMemo(() => extractHeadings(markdown), [markdown])

  const currentIndex = DOC_CHAPTERS.findIndex((item) => item.slug === slug)
  const previous = currentIndex > 0 ? DOC_CHAPTERS[currentIndex - 1] : undefined
  const next =
    currentIndex >= 0 && currentIndex < DOC_CHAPTERS.length - 1
      ? DOC_CHAPTERS[currentIndex + 1]
      : undefined

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [slug])

  useEffect(() => {
    document.title = chapter
      ? `${chapter.title} - ${context.siteName}`
      : context.siteName
  }, [chapter, context.siteName])

  return (
    <PublicLayout showMainContainer={false}>
      <div className='mx-auto w-full max-w-[100rem] px-4 pt-20 pb-24 md:px-6'>
        <div className='flex gap-8'>
          {/*
            Fixed height (not max-height) so the chapter list inside DocSidebar
            gets a stable scroll container of its own, independent of the
            article's scrolling.
          */}
          <aside className='hidden w-60 shrink-0 lg:block'>
            <div className='sticky top-20 h-[calc(100vh-6rem)] pr-2'>
              <DocSidebar activeSlug={slug} context={context} />
            </div>
          </aside>

          <main className='min-w-0 flex-1'>
            <div className='mb-4 lg:hidden'>
              <Button
                onClick={() => setMobileNavOpen(true)}
                size='sm'
                variant='outline'
              >
                <Menu className='size-4' />
                {t('All chapters')}
              </Button>
            </div>

            {chapter && (
              <article className='min-w-0'>
                <DocContent headings={headings} markdown={markdown} />
              </article>
            )}

            <nav
              aria-label={t('Docs')}
              className='mt-12 grid gap-3 border-t pt-6 sm:grid-cols-2'
            >
              {previous ? (
                <Link
                  className='hover:border-foreground/30 hover:bg-muted/40 group flex flex-col gap-1 rounded-lg border px-4 py-3 transition-colors'
                  params={{ slug: previous.slug }}
                  to='/docs/$slug'
                >
                  <span className='text-muted-foreground flex items-center gap-1.5 text-xs'>
                    <ArrowLeft className='size-3.5' />
                    {t('Previous')}
                  </span>
                  <span className='text-sm font-medium'>{previous.title}</span>
                </Link>
              ) : (
                <span />
              )}
              {next && (
                <Link
                  className='hover:border-foreground/30 hover:bg-muted/40 group flex flex-col gap-1 rounded-lg border px-4 py-3 text-right transition-colors sm:col-start-2'
                  params={{ slug: next.slug }}
                  to='/docs/$slug'
                >
                  <span className='text-muted-foreground flex items-center justify-end gap-1.5 text-xs'>
                    {t('Next')}
                    <ArrowRight className='size-3.5' />
                  </span>
                  <span className='text-sm font-medium'>{next.title}</span>
                </Link>
              )}
            </nav>
          </main>

          <aside className='hidden w-56 shrink-0 xl:block'>
            <div className='sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain'>
              <DocToc headings={headings} />
            </div>
          </aside>
        </div>
      </div>

      <Sheet onOpenChange={setMobileNavOpen} open={mobileNavOpen}>
        <SheetContent
          className='w-[85vw] max-w-sm overflow-y-auto p-4'
          side='left'
        >
          <SheetTitle className='mb-4 text-base'>{t('Docs')}</SheetTitle>
          <DocSidebar
            activeSlug={slug}
            context={context}
            onNavigate={() => setMobileNavOpen(false)}
          />
        </SheetContent>
      </Sheet>
    </PublicLayout>
  )
}
