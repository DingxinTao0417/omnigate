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
import type { ReactNode } from 'react'
import {
  Cable,
  CircleDollarSign,
  Gauge,
  Globe2,
  KeyRound,
  Layers,
  Receipt,
  ShieldCheck,
  Sparkles,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { AnimateInView } from '@/components/animate-in-view'
import { cn } from '@/lib/utils'

interface FeaturesProps {
  className?: string
}

type FeatureCard = {
  title: string
  desc: string
  hint: string
  icon: ReactNode
  accent: string
}

export function Features(_props: FeaturesProps) {
  const { t } = useTranslation()

  const cards: FeatureCard[] = [
    {
      title: t('Unified API'),
      desc: t(
        'One OpenAI-compatible endpoint for major models—swap clients without rewriting integrations.'
      ),
      hint: t('One interface, many models'),
      icon: <Cable className='size-6' strokeWidth={1.5} />,
      accent: 'from-blue-500/15 to-sky-500/5 text-blue-600 dark:text-blue-400',
    },
    {
      title: t('Drop-in compatibility'),
      desc: t(
        'Works with Claude Code, Codex, Cherry Studio and any app that lets you set a Base URL.'
      ),
      hint: t('Point, paste, go'),
      icon: <Sparkles className='size-6' strokeWidth={1.5} />,
      accent:
        'from-violet-500/15 to-fuchsia-500/5 text-violet-600 dark:text-violet-400',
    },
    {
      title: t('Flexible billing'),
      desc: t(
        'Pay only for what you use. No forced packages—scale up or down as traffic changes.'
      ),
      hint: t('Usage-based by default'),
      icon: <CircleDollarSign className='size-6' strokeWidth={1.5} />,
      accent:
        'from-amber-500/15 to-orange-500/5 text-amber-600 dark:text-amber-400',
    },
    {
      title: t('Built for concurrency'),
      desc: t(
        'Stable relay under load so your tools keep streaming instead of timing out mid-task.'
      ),
      hint: t('Steady under pressure'),
      icon: <Gauge className='size-6' strokeWidth={1.5} />,
      accent: 'from-cyan-500/15 to-teal-500/5 text-cyan-600 dark:text-cyan-400',
    },
    {
      title: t('Service you can reach'),
      desc: t(
        'When something breaks, request IDs and usage logs make it fast to locate and fix.'
      ),
      hint: t('Traceable every request'),
      icon: <ShieldCheck className='size-6' strokeWidth={1.5} />,
      accent:
        'from-emerald-500/15 to-green-500/5 text-emerald-600 dark:text-emerald-400',
    },
    {
      title: t('Transparent metering'),
      desc: t(
        'Token-level usage, cache-aware pricing when available, and a clear per-request log.'
      ),
      hint: t('No black-box bills'),
      icon: <Receipt className='size-6' strokeWidth={1.5} />,
      accent:
        'from-purple-500/15 to-indigo-500/5 text-purple-600 dark:text-purple-400',
    },
    {
      title: t('Scoped API keys'),
      desc: t(
        'Per-key quota, expiry, model scope and IP allowlist—keep team access under control.'
      ),
      hint: t('Keys with guardrails'),
      icon: <KeyRound className='size-6' strokeWidth={1.5} />,
      accent:
        'from-indigo-500/15 to-blue-500/5 text-indigo-600 dark:text-indigo-400',
    },
    {
      title: t('Models that matter'),
      desc: t(
        'Claude and GPT families on one credential today—add clients without juggling accounts.'
      ),
      hint: t('One key, two families'),
      icon: <Layers className='size-6' strokeWidth={1.5} />,
      accent: 'from-rose-500/15 to-pink-500/5 text-rose-600 dark:text-rose-400',
    },
  ]

  return (
    <section className='relative z-10 px-6 py-20 md:py-28'>
      <div className='mx-auto max-w-6xl'>
        <AnimateInView className='mb-12 text-center md:mb-16'>
          <h2 className='text-2xl font-bold tracking-tight md:text-4xl'>
            {t('Our')}{' '}
            <span className='bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 bg-clip-text text-transparent dark:from-blue-400 dark:via-indigo-400 dark:to-violet-400'>
              {t('advantages')}
            </span>
          </h2>
          <p className='text-muted-foreground mx-auto mt-3 max-w-md text-sm leading-relaxed md:text-base'>
            {t('Built for real products—stable access, clear costs, simple setup.')}
          </p>
        </AnimateInView>

        <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5'>
          {cards.map((card, i) => (
            <AnimateInView
              key={card.title}
              delay={i * 60}
              animation='fade-up'
              className={cn(
                'group border-border/40 bg-card/80 hover:border-border/70',
                'rounded-2xl border p-6 shadow-[0_1px_2px_rgba(0,0,0,0.03)]',
                'backdrop-blur-sm transition-all duration-300',
                'hover:-translate-y-0.5 hover:shadow-[0_12px_32px_-16px_rgba(79,70,229,0.28)]'
              )}
            >
              <div
                className={cn(
                  'mb-5 flex size-12 items-center justify-center rounded-2xl bg-gradient-to-br',
                  card.accent
                )}
              >
                {card.icon}
              </div>
              <h3 className='text-foreground mb-2 text-base font-semibold tracking-tight'>
                {card.title}
              </h3>
              <p className='text-muted-foreground text-sm leading-relaxed'>
                {card.desc}
              </p>
              <p className='text-muted-foreground/55 mt-4 text-xs font-medium'>
                {card.hint}
              </p>
            </AnimateInView>
          ))}
        </div>

        {/* Quiet global-ready strip — lighter than a full stats bar */}
        <AnimateInView
          delay={200}
          className='text-muted-foreground/70 mt-10 flex items-center justify-center gap-2 text-center text-xs md:text-sm'
        >
          <Globe2 className='size-3.5 shrink-0 opacity-70' strokeWidth={1.75} />
          <span>
            {t('OpenAI-compatible routes · usage logs · keys you control')}
          </span>
        </AnimateInView>
      </div>
    </section>
  )
}
