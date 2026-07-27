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
import type { DocHeading } from '../types'

/**
 * Builds a URL-safe anchor id from heading text. CJK characters are kept as-is
 * because stripping them would collapse most Chinese headings to empty strings.
 */
function slugifyHeading(text: string): string {
  return (
    text
      .trim()
      .toLowerCase()
      .replaceAll(/[`*_[\]()#!|]/g, '')
      .replaceAll(/[\s/\\.,:;'"?]+/g, '-')
      .replaceAll(/^-+|-+$/g, '') || 'section'
  )
}

/**
 * Extracts h2/h3 headings for the on-page table of contents. Fenced code blocks
 * are skipped so that shell comments like `# install` are not mistaken for
 * headings.
 */
export function extractHeadings(markdown: string): DocHeading[] {
  const headings: DocHeading[] = []
  const used = new Map<string, number>()
  let inFence = false

  for (const line of markdown.split('\n')) {
    if (line.trimStart().startsWith('```')) {
      inFence = !inFence
      continue
    }
    if (inFence) continue

    const match = /^(#{2,3})\s+(.+?)\s*$/.exec(line)
    if (!match) continue

    const text = match[2].replaceAll('`', '')
    const base = slugifyHeading(text)
    const seen = used.get(base) ?? 0
    used.set(base, seen + 1)

    headings.push({
      id: seen === 0 ? base : `${base}-${seen}`,
      level: match[1].length === 2 ? 2 : 3,
      text,
    })
  }

  return headings
}

/** Strips markdown syntax so chapter bodies can be plain-text searched. */
export function toSearchText(markdown: string): string {
  return markdown
    .replaceAll(/```[\s\S]*?```/g, ' ')
    .replaceAll(/[#>*_`|-]/g, ' ')
    .replaceAll(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replaceAll(/\s+/g, ' ')
    .toLowerCase()
}
