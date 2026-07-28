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
import type { DocChapter, DocGroup } from '../types'
import { claudeCodeAdvanced } from './advanced'
import { apiReference } from './api'
import { claudeMd } from './claude-md'
import { concepts, introduction } from './getting-started'
import { claudeCode, prerequisites } from './install-cli'
import { codex, opencode } from './install-codex'
import { guiClients, otherClis } from './other-tools'
import { insights, myClaudeMd, mySettings, myUsage } from './practice'
import { settingsJson } from './settings'
import { statusline } from './statusline'
import { troubleshooting } from './troubleshooting'

export const DOC_GROUPS: DocGroup[] = [
  {
    id: 'start',
    titleKey: 'Getting Started',
    chapters: [introduction, concepts],
  },
  {
    id: 'install',
    titleKey: 'Install AI Coding Tools',
    chapters: [
      prerequisites,
      claudeCode,
      codex,
      opencode,
      otherClis,
      guiClients,
    ],
  },
  {
    id: 'claude-code',
    titleKey: 'Claude Code Deep Dive',
    chapters: [claudeCodeAdvanced, claudeMd, settingsJson, statusline],
  },
  {
    id: 'reference',
    titleKey: 'Reference',
    chapters: [apiReference, troubleshooting],
  },
  // Opinionated content lives in its own group so readers can tell at a glance
  // that these pages are one person's preferences, not project requirements.
  {
    id: 'practice',
    titleKey: 'Site Owner Practice',
    chapters: [insights, myUsage, myClaudeMd, mySettings],
  },
]

export const DOC_CHAPTERS: DocChapter[] = DOC_GROUPS.flatMap(
  (group) => group.chapters
)

export const DEFAULT_DOC_SLUG = introduction.slug

export function findChapter(slug: string | undefined): DocChapter | undefined {
  if (!slug) return undefined
  return DOC_CHAPTERS.find((chapter) => chapter.slug === slug)
}
