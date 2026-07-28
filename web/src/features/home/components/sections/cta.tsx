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
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { Button } from '@/components/ui/button'

interface CTAProps {
  className?: string
  isAuthenticated?: boolean
}

export function CTA(props: CTAProps) {
  const { t } = useTranslation()

  return (
    <section className='relative z-10 overflow-hidden px-6 py-20 md:py-28'>
      <div
        aria-hidden
        className='pointer-events-none absolute inset-0 -z-10 opacity-30 dark:opacity-[0.14]'
        style={{
          background: [
            'radial-gradient(ellipse 55% 50% at 50% 40%, oklch(0.72 0.14 265 / 55%) 0%, transparent 72%)',
            'radial-gradient(ellipse 40% 40% at 70% 70%, oklch(0.70 0.12 300 / 35%) 0%, transparent 70%)',
          ].join(', '),
        }}
      />

      <AnimateInView
        className='mx-auto max-w-2xl text-center'
        animation='scale-in'
      >
        <h2 className='text-3xl leading-tight font-bold tracking-tight md:text-5xl'>
          <span className='bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400'>
            24/7/365
          </span>{' '}
          <span className='text-foreground'>{t('always-on support')}</span>
        </h2>
        <p className='text-muted-foreground mx-auto mt-4 max-w-md text-base leading-relaxed md:text-lg'>
          {t("We're here when your integration needs a hand.")}
        </p>
        <div className='mt-8 flex flex-wrap items-center justify-center gap-3'>
          {props.isAuthenticated ? (
            <Button
              className='h-11 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(79,70,229,0.65)] hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500'
              render={<Link to='/dashboard' />}
            >
              {t('Go to Dashboard')}
            </Button>
          ) : (
            <>
              <Button
                className='h-11 rounded-full bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 px-8 text-sm font-semibold text-white shadow-[0_12px_28px_-12px_rgba(79,70,229,0.65)] hover:from-blue-500 hover:via-indigo-500 hover:to-violet-500'
                render={<Link to='/sign-up' />}
              >
                {t('Get Started')}
              </Button>
              <Button
                variant='outline'
                className='border-border/50 hover:border-border hover:bg-muted/50 h-11 rounded-full px-6 text-sm font-medium'
                render={<Link to='/about' />}
              >
                {t('Contact us')}
              </Button>
            </>
          )}
        </div>
      </AnimateInView>
    </section>
  )
}
