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
type AudienceNote = {
  /** What problem this config or practice actually solves. */
  solves: string
  /** Who benefits from copying it. */
  fits: string
  /** Who should not copy it, and why. This is the part readers skip. */
  avoid: string
}

/**
 * Every chapter in the "站主实践" group opens with this block. The group exists
 * to separate opinion from the objective reference chapters, so each page has to
 * say plainly that it is one person's setup and where copying it breaks down.
 */
export function buildPracticeIntro(note: AudienceNote): string {
  return `> **这是个人配置，不是规范。** 本章属于「站主实践」，记录的是我自己的取舍，你完全可以不同意。
> 客观的参数说明请看[Claude Code 进阶](/docs/claude-code-advanced)那几章。
>
> - **解决什么问题**：${note.solves}
> - **适合**：${note.fits}
> - **不适合**：${note.avoid}
`
}
