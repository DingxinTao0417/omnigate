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
import { useQuery } from '@tanstack/react-query'
import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import { PublicLayout } from '@/components/layout'
import { RichContent } from '@/components/rich-content'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import { Skeleton } from '@/components/ui/skeleton'
import { useInAppMarkdownLinks } from '@/hooks/use-in-app-markdown-links'
import { useStatus } from '@/hooks/use-status'
import { DEFAULT_SYSTEM_NAME, PUBLIC_API_BASE_URL } from '@/lib/constants'
import { isHttpUrl, isLikelyHtml } from '@/lib/content-format'
import { cn } from '@/lib/utils'

import { getAboutContent } from './api'
import { buildAboutFaqs, buildAboutMarkdown } from './content'

export function About() {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { data, isLoading } = useQuery({
    queryKey: ['about-content'],
    queryFn: getAboutContent,
  })

  const siteName =
    (status?.system_name as string | undefined)?.trim() || DEFAULT_SYSTEM_NAME

  // Falls back to the built-in page so a fresh install shows this site's own
  // "about" rather than an empty-state placeholder.
  const aboutContext = useMemo(
    () => ({ baseUrl: PUBLIC_API_BASE_URL, siteName }),
    [siteName]
  )
  const builtInContent = useMemo(
    () => buildAboutMarkdown(aboutContext),
    [aboutContext]
  )
  const faqs = useMemo(() => buildAboutFaqs(aboutContext), [aboutContext])

  useEffect(() => {
    document.title = `${t('About')} - ${siteName}`
  }, [siteName, t])

  const { hostRef, handleClick } = useInAppMarkdownLinks(builtInContent)

  const rawContent = data?.data?.trim() ?? ''
  const hasContent = rawContent.length > 0
  const isUrl = hasContent && isHttpUrl(rawContent)
  const contentIsHtml = hasContent && isLikelyHtml(rawContent)

  if (isLoading) {
    return (
      <PublicLayout>
        <div className='mx-auto flex max-w-4xl flex-col gap-4 py-12'>
          <Skeleton className='h-8 w-[45%]' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-[90%]' />
          <Skeleton className='h-4 w-[80%]' />
        </div>
      </PublicLayout>
    )
  }

  if (!hasContent) {
    return (
      <PublicLayout showMainContainer={false}>
        <div className='relative overflow-hidden'>
          {/* Soft gradient wash, matching the landing hero's treatment. */}
          <div
            aria-hidden
            className='pointer-events-none absolute inset-x-0 top-0 -z-10 h-96 opacity-20 dark:opacity-[0.10]'
            style={{
              background: [
                'radial-gradient(ellipse 55% 60% at 25% 0%, oklch(0.72 0.18 250 / 75%) 0%, transparent 70%)',
                'radial-gradient(ellipse 45% 50% at 80% 10%, oklch(0.65 0.15 200 / 55%) 0%, transparent 70%)',
              ].join(', '),
            }}
          />

          {/*
            pb-24 keeps the last section clear of the viewport edge. The ref and
            click handler sit on this shared container so FAQ answers — which
            mount later, when a panel opens — get the same in-app link handling
            as the prose above.
          */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events */}
          <div
            className='mx-auto max-w-3xl px-5 pt-24 pb-24 md:px-6'
            onClick={handleClick}
            ref={hostRef}
          >
            <div>
              <RichContent
                mode='markdown'
                content={builtInContent}
                className={cn(
                  'prose-neutral dark:prose-invert max-w-none',
                  '[&_h1]:mb-4 [&_h1]:text-[2rem] [&_h1]:leading-tight [&_h1]:tracking-tight',
                  '[&_h1+p]:text-muted-foreground [&_h1+p]:text-base [&_h1+p]:leading-relaxed',
                  '[&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-xl',
                  // The shared renderer already makes tables their own
                  // horizontal scroller; nowrap cells keep URLs on one line
                  // instead of breaking mid-string. No min-width, or the table
                  // would push past the container on narrow screens.
                  '[&_td]:whitespace-nowrap [&_th]:whitespace-nowrap',
                  '[&_code]:text-[0.85em] [&_code]:before:content-none [&_code]:after:content-none'
                )}
              />
            </div>

            <section className='mt-14'>
              <h2 className='mb-1 text-xl font-semibold tracking-tight'>
                {t('FAQ')}
              </h2>
              <p className='text-muted-foreground mb-4 text-sm'>
                {t('Click a question to expand the answer.')}
              </p>

              <Accordion className='border-border/70 rounded-xl border px-4'>
                {faqs.map((faq) => (
                  <AccordionItem key={faq.question} value={faq.question}>
                    <AccordionTrigger className='py-3.5 text-[15px] hover:no-underline'>
                      {faq.question}
                    </AccordionTrigger>
                    <AccordionContent>
                      <div>
                        <RichContent
                          mode='markdown'
                          content={faq.answer}
                          className='prose-neutral dark:prose-invert text-muted-foreground max-w-none text-sm [&_code]:before:content-none [&_code]:after:content-none [&_p]:my-0 [&_p:not(:last-child)]:mb-3'
                        />
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </section>
          </div>
        </div>
      </PublicLayout>
    )
  }

  if (isUrl) {
    return (
      <PublicLayout showMainContainer={false}>
        <iframe
          src={rawContent}
          className='h-[calc(100vh-3.5rem)] w-full border-0'
          title={t('About')}
          sandbox='allow-forms allow-popups allow-popups-to-escape-sandbox allow-scripts'
        />
      </PublicLayout>
    )
  }

  if (contentIsHtml) {
    return (
      <PublicLayout showMainContainer={false}>
        <RichContent
          mode='html'
          htmlVariant='isolated'
          content={rawContent}
          className='prose-neutral dark:prose-invert max-w-none'
        />
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className='mx-auto max-w-6xl px-4 py-8'>
        <RichContent
          mode='markdown'
          content={rawContent}
          className='prose-neutral dark:prose-invert max-w-none'
        />
      </div>
    </PublicLayout>
  )
}
