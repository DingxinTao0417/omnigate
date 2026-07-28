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
import { CherryStudio, ClaudeCode, OpenAI } from '@lobehub/icons'
import { Link } from '@tanstack/react-router'
import { ArrowRight, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { Button } from '@/components/ui/button'
import { useStatus } from '@/hooks/use-status'
import { DEFAULT_DOCS_LINK, LEGACY_UPSTREAM_DOCS_LINK } from '@/lib/constants'

import { useSystemConfig } from '@/hooks/use-system-config'

import { HeroOrbitVisual } from '../hero-orbit-visual'

interface HeroProps {
  className?: string
  isAuthenticated?: boolean
}

// Stylized three-dots indicator representing "More"
const MoreIcon = () => (
  <svg
    className='text-muted-foreground/60 group-hover:text-foreground size-6 shrink-0 transition-colors'
    viewBox='0 0 24 24'
    fill='none'
    xmlns='http://www.w3.org/2000/svg'
  >
    <circle cx='6' cy='12' r='2' fill='currentColor' />
    <circle cx='12' cy='12' r='2' fill='currentColor' />
    <circle cx='18' cy='12' r='2' fill='currentColor' />
  </svg>
)

export function Hero(props: HeroProps) {
  const { t } = useTranslation()
  const { status } = useStatus()
  const { systemName } = useSystemConfig()
  const configuredDocsLink = (status?.docs_link as string | undefined)?.trim()
  const docsUrl =
    configuredDocsLink && configuredDocsLink !== LEGACY_UPSTREAM_DOCS_LINK
      ? configuredDocsLink
      : DEFAULT_DOCS_LINK

  const primaryCtaClass =
    'group h-11 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-6 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(79,70,229,0.65)] hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500'

  const renderDocsButton = () => {
    const isExternal = docsUrl.startsWith('http')
    if (isExternal) {
      return (
        <Button
          variant='outline'
          className='group border-border/50 hover:border-border hover:bg-muted/50 inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-sm font-medium'
          render={
            <a href={docsUrl} target='_blank' rel='noopener noreferrer' />
          }
        >
          <BookOpen className='text-muted-foreground/80 group-hover:text-foreground size-4 transition-colors duration-200' />
          <span>{t('API Docs')}</span>
        </Button>
      )
    }
    return (
      <Button
        variant='outline'
        className='group border-border/50 hover:border-border hover:bg-muted/50 inline-flex h-11 items-center gap-1.5 rounded-full px-5 text-sm font-medium'
        render={<Link to={docsUrl} />}
      >
        <BookOpen className='text-muted-foreground/80 group-hover:text-foreground size-4 transition-colors duration-200' />
        <span>{t('API Docs')}</span>
      </Button>
    )
  }

  return (
    <section className='relative z-10 overflow-hidden px-6 pt-24 pb-16 md:pt-32 md:pb-24 lg:pt-36 lg:pb-28'>
      {/* Soft product-landing wash (indigo/violet, not a grid-heavy dashboard look) */}
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 opacity-40 dark:opacity-[0.22]'
        style={{
          background: [
            'radial-gradient(ellipse 55% 45% at 18% 18%, oklch(0.74 0.16 265 / 55%) 0%, transparent 70%)',
            'radial-gradient(ellipse 50% 42% at 82% 22%, oklch(0.70 0.14 300 / 40%) 0%, transparent 72%)',
            'radial-gradient(ellipse 45% 40% at 50% 88%, oklch(0.72 0.10 240 / 28%) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      <div className='mx-auto grid max-w-6xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-6'>
        {/* Left Column: Title, description, action buttons and application support */}
        <div className='flex flex-col items-start text-left lg:col-span-6'>
          <div
            className='landing-animate-fade-up mb-3 text-[clamp(1.85rem,3.6vw,2.75rem)] leading-none font-bold tracking-tight opacity-0'
            style={{ animationDelay: '0ms' }}
          >
            <span className='bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400'>
              {systemName || 'Omnigate'}
            </span>
            <span className='text-foreground'> API</span>
          </div>
          <h1
            className='landing-animate-fade-up w-full max-w-full whitespace-nowrap text-[clamp(1.35rem,calc(0.55rem+2.8vw),2.55rem)] leading-[1.2] font-bold tracking-tight text-foreground opacity-0'
            style={{ animationDelay: '40ms' }}
          >
            {t('Stable access to every model you need.')}
          </h1>
          <p
            className='landing-animate-fade-up text-muted-foreground mt-5 max-w-xl text-base leading-relaxed opacity-0 md:text-[15px]'
            style={{ animationDelay: '100ms' }}
          >
            {t(
              'Call Claude, GPT and more through a single OpenAI-compatible API. One key, clear usage, no juggling accounts or top-ups.'
            )}
          </p>

          <div
            className='landing-animate-fade-up mt-8 flex flex-wrap items-center gap-3 opacity-0'
            style={{ animationDelay: '120ms' }}
          >
            {props.isAuthenticated ? (
              <>
                <Button
                  className={primaryCtaClass}
                  render={<Link to='/dashboard' />}
                >
                  {t('Go to Dashboard')}
                  <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>
                {renderDocsButton()}
              </>
            ) : (
              <>
                <Button
                  className={primaryCtaClass}
                  render={<Link to='/sign-up' />}
                >
                  {t('Get Started')}
                  <ArrowRight className='ml-1.5 size-4 transition-transform duration-200 group-hover:translate-x-0.5' />
                </Button>
                <Button
                  variant='outline'
                  className='border-border/50 hover:border-border hover:bg-muted/50 h-11 rounded-full px-5 text-sm font-medium'
                  render={<Link to='/pricing' />}
                >
                  {t('View Pricing')}
                </Button>
                {renderDocsButton()}
              </>
            )}
          </div>

          {/* Supported Apps */}
          <div
            className='landing-animate-fade-up mt-10 w-full max-w-xl opacity-0'
            style={{ animationDelay: '180ms' }}
          >
            <div className='mb-4 flex flex-col gap-1'>
              <span className='text-muted-foreground/50 text-[10px] font-bold tracking-[0.15em] uppercase'>
                {t('Supported Applications')}
              </span>
              <p className='text-muted-foreground/60 text-xs leading-relaxed'>
                {t(
                  'Anything that lets you change the Base URL works. Setup steps for each are in the docs.'
                )}
              </p>
            </div>
            <div className='flex flex-wrap items-center gap-3'>
              {/* Claude Code — the primary use case, so it leads. */}
              <Link
                to='/docs/$slug'
                params={{ slug: 'claude-code' }}
                className='group border-border/40 bg-muted/15 text-foreground/80 hover:border-border hover:bg-muted/30 hover:text-foreground flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-medium shadow-[0_1px_2.5px_rgba(0,0,0,0.01)] backdrop-blur-xs transition-all duration-300 hover:scale-[1.02]'
              >
                {/* Icon is decorative: the adjacent text already names the app,
                    and the icon's own <title> would double up in screen readers. */}
                <ClaudeCode.Color size={24} className='shrink-0' aria-hidden />
                <span>Claude Code</span>
              </Link>

              {/* Codex CLI */}
              <Link
                to='/docs/$slug'
                params={{ slug: 'codex' }}
                className='group border-border/40 bg-muted/15 text-foreground/80 hover:border-border hover:bg-muted/30 hover:text-foreground flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-medium shadow-[0_1px_2.5px_rgba(0,0,0,0.01)] backdrop-blur-xs transition-all duration-300 hover:scale-[1.02]'
              >
                <OpenAI size={22} className='shrink-0' aria-hidden />
                <span>Codex</span>
              </Link>

              {/* Cherry Studio */}
              <a
                href='https://cherry-ai.com'
                target='_blank'
                rel='noopener noreferrer'
                className='group border-border/40 bg-muted/15 text-foreground/80 hover:border-border hover:bg-muted/30 hover:text-foreground flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-medium shadow-[0_1px_2.5px_rgba(0,0,0,0.01)] backdrop-blur-xs transition-all duration-300 hover:scale-[1.02]'
              >
                <CherryStudio.Color
                  size={24}
                  className='shrink-0'
                  aria-hidden
                />
                <span>Cherry Studio</span>
              </a>

              {/* CC Switch */}
              <a
                href='https://ccswitch.io'
                target='_blank'
                rel='noopener noreferrer'
                className='group border-border/40 bg-muted/15 text-foreground/80 hover:border-border hover:bg-muted/30 hover:text-foreground flex items-center gap-3 rounded-full border px-5 py-2.5 text-sm font-medium shadow-[0_1px_2.5px_rgba(0,0,0,0.01)] backdrop-blur-xs transition-all duration-300 hover:scale-[1.02]'
              >
                <img
                  src='https://ccswitch.io/favicon.png'
                  alt='CC Switch'
                  className='size-6 shrink-0 rounded-md object-contain'
                  onError={(e) => {
                    // Fallback to a styled text avatar if the remote favicon fails to load in sandbox or local environments
                    e.currentTarget.style.display = 'none'
                    const fallback = e.currentTarget.nextSibling as HTMLElement
                    if (fallback) fallback.style.display = 'flex'
                  }}
                />
                <span
                  style={{ display: 'none' }}
                  className='size-6 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-[10px] font-bold text-blue-600 dark:bg-blue-400/10 dark:text-blue-400'
                >
                  CC
                </span>
                <span>CC Switch</span>
              </a>

              {/* Leads to the client setup chapters rather than being a dead chip. */}
              <Link
                to='/docs/$slug'
                params={{ slug: 'gui-clients' }}
                className='group border-border/40 bg-muted/15 text-foreground/55 hover:border-border hover:bg-muted/30 hover:text-foreground flex items-center gap-2.5 rounded-full border px-5 py-2.5 text-sm font-medium shadow-[0_1px_2.5px_rgba(0,0,0,0.01)] backdrop-blur-xs transition-all duration-300 hover:scale-[1.02]'
              >
                <MoreIcon />
                <span>{t('More Apps')}</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Right column: orbit labels + database share one geometric center */}
        <div
          className='landing-animate-fade-up flex w-full items-center justify-center opacity-0 lg:col-span-6'
          style={{ animationDelay: '280ms' }}
        >
          <HeroOrbitVisual className='mt-2 lg:mt-0' systemName={systemName} />
        </div>
      </div>
    </section>
  )
}
