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
/** Runtime values injected into every doc chapter so samples show the live host. */
export type DocContext = {
  baseUrl: string
  siteName: string
}

export type DocChapter = {
  slug: string
  title: string
  summary: string
  keywords: string[]
  build: (context: DocContext) => string
}

export type DocGroup = {
  id: string
  /** i18n key, translated in the sidebar. */
  titleKey: string
  chapters: DocChapter[]
}

export type DocHeading = {
  id: string
  text: string
  level: 2 | 3
}
