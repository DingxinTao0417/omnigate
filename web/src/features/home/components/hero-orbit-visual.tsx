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
import {
  Activity,
  Gauge,
  KeyRound,
  Layers,
  ShieldCheck,
  Zap,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { cn } from '@/lib/utils'

type OrbitPill = {
  labelKey: string
  icon: LucideIcon
  /**
   * Degrees in the same convention as before: 0 = right, -90 = top,
   * counter-clockwise. Spacing is exactly 60°.
   */
  angle: number
  delayMs: number
}

const ORBIT_PILLS: OrbitPill[] = [
  { labelKey: 'Reliable delivery', icon: ShieldCheck, angle: -90, delayMs: 0 },
  { labelKey: 'One API key', icon: KeyRound, angle: -30, delayMs: 350 },
  { labelKey: 'Transparent billing', icon: Gauge, angle: 30, delayMs: 700 },
  { labelKey: 'High concurrency', icon: Zap, angle: 90, delayMs: 200 },
  { labelKey: 'Stable streaming', icon: Activity, angle: 150, delayMs: 550 },
  { labelKey: 'Multi-model routing', icon: Layers, angle: 210, delayMs: 900 },
]

/** Pixel radius from shared center to the pill anchor (same origin as the DB). */
const ORBIT_RADIUS_PX = 198

type HeroOrbitVisualProps = {
  className?: string
  systemName?: string
}

/**
 * Stacked cylinder database only — no card chrome, no labels.
 * z-order: top layer covers middle, middle covers bottom.
 */
function AnimatedDatabaseMark() {
  return (
    <div
      className='hero-orbit-card relative h-[8.5rem] w-[7.25rem] sm:h-[9.5rem] sm:w-[8rem]'
      aria-hidden
    >
      <div className='pointer-events-none absolute inset-[-30%] rounded-full bg-[radial-gradient(circle_at_50%_55%,oklch(0.68_0.16_275_/_0.45),transparent_65%)] blur-2xl dark:bg-[radial-gradient(circle_at_50%_55%,oklch(0.48_0.14_275_/_0.5),transparent_68%)]' />

      <div className='hero-db-stack relative h-full w-full'>
        <div
          className='hero-db-layer absolute top-[54%] right-0 left-0 z-[1] h-[44%]'
          style={{ animationDelay: '0.7s' }}
        >
          <div className='absolute inset-x-[6%] top-[26%] bottom-[2%] rounded-b-[48%] bg-gradient-to-b from-violet-600/95 via-indigo-700 to-blue-900' />
          <div className='absolute inset-x-[6%] top-0 h-[52%] rounded-[50%] bg-gradient-to-br from-violet-400 via-indigo-500 to-blue-700 shadow-[0_8px_18px_-6px_rgba(67,56,202,0.55)]' />
          <div className='absolute inset-x-[16%] top-[10%] h-[26%] rounded-[50%] bg-white/12' />
        </div>

        <div
          className='hero-db-layer absolute top-[27%] right-0 left-0 z-[2] h-[40%]'
          style={{ animationDelay: '0.35s' }}
        >
          <div className='absolute inset-x-[6%] top-[28%] bottom-0 rounded-b-[42%] bg-gradient-to-b from-indigo-500/95 via-violet-600 to-violet-800' />
          <div className='absolute inset-x-[6%] top-0 h-[56%] rounded-[50%] bg-gradient-to-br from-indigo-300 via-violet-400 to-violet-600 shadow-[0_6px_16px_-4px_rgba(99,102,241,0.55)]' />
          <div className='absolute inset-x-[16%] top-[10%] h-[28%] rounded-[50%] bg-white/18' />
        </div>

        <div
          className='hero-db-layer absolute top-0 right-0 left-0 z-[3] h-[40%]'
          style={{ animationDelay: '0s' }}
        >
          <div className='absolute inset-x-[6%] top-[28%] bottom-0 rounded-b-[42%] bg-gradient-to-b from-blue-500/95 via-indigo-500 to-violet-600' />
          <div className='absolute inset-x-[6%] top-0 h-[56%] rounded-[50%] bg-gradient-to-br from-blue-300 via-indigo-400 to-violet-500 shadow-[0_6px_16px_-4px_rgba(79,70,229,0.6)]' />
          <div className='absolute inset-x-[16%] top-[10%] h-[28%] rounded-[50%] bg-white/25' />
        </div>

        <span className='hero-db-dot hero-db-dot-a absolute left-[26%] z-[5] size-1.5 rounded-full bg-white/95' />
        <span className='hero-db-dot hero-db-dot-b absolute left-[50%] z-[5] size-1 rounded-full bg-cyan-200/95' />
        <span className='hero-db-dot hero-db-dot-c absolute left-[66%] z-[5] size-1.5 rounded-full bg-violet-100/95' />
      </div>
    </div>
  )
}

/**
 * Orbit labels and database share one origin (left/top 50% of the stage).
 * Pills use rotate → translateY so they stay on a true circle around the DB.
 */
export function HeroOrbitVisual(props: HeroOrbitVisualProps) {
  const { t } = useTranslation()

  return (
    <div
      className={cn(
        'relative mx-auto aspect-square w-full max-w-[30rem] sm:max-w-[34rem]',
        props.className
      )}
    >
      {/* Shared geometric center for rails, pills, and database */}
      <div className='absolute top-1/2 left-1/2 h-0 w-0'>
        {/* Glow */}
        <div
          aria-hidden
          className='pointer-events-none absolute top-1/2 left-1/2 size-[min(92vw,26rem)] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle_at_50%_48%,oklch(0.72_0.14_275_/_0.32),transparent_66%)] sm:size-[28rem] dark:bg-[radial-gradient(circle_at_50%_48%,oklch(0.42_0.12_275_/_0.4),transparent_68%)]'
        />

        {/* Rails — same center as DB */}
        <div
          aria-hidden
          className='border-border/35 pointer-events-none absolute top-1/2 left-1/2 size-[min(86vw,24.5rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed opacity-80 sm:size-[26rem] dark:border-white/12'
        />
        <div
          aria-hidden
          className='border-border/25 pointer-events-none absolute top-1/2 left-1/2 size-[min(62vw,17rem)] -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed opacity-70 sm:size-[18rem] dark:border-white/10'
        />

        {/* Slow decorative spin on the outer rail */}
        <div
          aria-hidden
          className='hero-orbit-spin pointer-events-none absolute top-1/2 left-1/2 size-[min(86vw,24.5rem)] -translate-x-1/2 -translate-y-1/2 sm:size-[26rem]'
        >
          <span className='absolute top-0 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-blue-500/45' />
          <span className='absolute bottom-0 left-1/2 size-1 -translate-x-1/2 rounded-full bg-violet-500/40' />
          <span className='absolute top-1/2 right-0 size-1 -translate-y-1/2 rounded-full bg-indigo-500/40' />
          <span className='absolute top-1/2 left-0 size-1 -translate-y-1/2 rounded-full bg-blue-400/35' />
        </div>

        {/* Pills on a true circle around the shared origin */}
        {ORBIT_PILLS.map((pill) => {
          const Icon = pill.icon
          // Convert our angle (0=right) so that rotate(0)+translateY(-R) points up.
          const cssAngle = pill.angle + 90
          return (
            <div
              key={pill.labelKey}
              className='absolute top-0 left-0 z-10'
              style={{
                transform: `rotate(${cssAngle}deg)`,
              }}
            >
              <div
                className='absolute top-0 left-0'
                style={{
                  transform: `translateY(-${ORBIT_RADIUS_PX}px)`,
                }}
              >
                <div
                  className='hero-orbit-float absolute top-0 left-0'
                  style={{ animationDelay: `${pill.delayMs}ms` }}
                >
                  <div
                    style={{
                      transform: `translate(-50%, -50%) rotate(${-cssAngle}deg)`,
                    }}
                  >
                    <div className='border-border/50 bg-background/90 text-foreground/90 flex items-center gap-1.5 rounded-full border px-2.5 py-1.5 text-[11px] font-medium whitespace-nowrap shadow-[0_10px_28px_-14px_rgba(79,70,229,0.5)] backdrop-blur-md sm:gap-2 sm:px-3 sm:text-xs dark:bg-background/75'>
                      <span className='flex size-5 shrink-0 items-center justify-center rounded-full bg-violet-500/10 text-violet-600 sm:size-6 dark:text-violet-300'>
                        <Icon className='size-3 sm:size-3.5' />
                      </span>
                      <span>{t(pill.labelKey)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}

        {/* Database — exact same origin as the orbit */}
        <div className='absolute top-0 left-0 z-20 -translate-x-1/2 -translate-y-1/2'>
          <AnimatedDatabaseMark />
        </div>
      </div>
    </div>
  )
}
