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
import type { DocChapter } from '../types'

export const claudeMd: DocChapter = {
  slug: 'claude-md',
  title: 'CLAUDE.md 怎么写',
  summary: '项目记忆的加载顺序、导入语法，以及写得好与写得差的区别。',
  keywords: ['CLAUDE.md', 'AGENTS.md', 'memory', '记忆', 'init', '导入'],
  build: () => `
# CLAUDE.md 怎么写

这是投入产出比最高的一件事。一份好的 \`CLAUDE.md\` 能让 Claude Code 少问一半的问题、少写一半的错代码；一份坏的只是白烧 token。

## 加载顺序

启动时按从宽到窄的顺序读，**全部拼接**，不是覆盖：

1. 企业级策略文件（如果有）
2. \`~/.claude/CLAUDE.md\` — 你的个人全局偏好
3. 项目根到当前目录一路上的 \`./CLAUDE.md\` 或 \`./.claude/CLAUDE.md\`
4. \`./CLAUDE.local.md\` — 只属于你、不进版本库的补充

越靠后越具体，冲突时更具体的赢。子目录里的 \`CLAUDE.md\` 会在 Claude 实际读到那个目录的文件时才按需加载，所以大 monorepo 可以按包分别写，不用挤在一份里。

## 导入其他文件

用 \`@路径\` 语法：

\`\`\`markdown
# CLAUDE.md

@AGENTS.md
@docs/architecture.md
\`\`\`

递归深度上限是 4 层。想让某段路径不被当成导入（比如你在讲解语法），用反引号包起来。

这个语法有个很实用的用法：**让多个工具共用一份规则**。Codex 和 OpenCode 读 \`AGENTS.md\`，Claude Code 读 \`CLAUDE.md\`，那就把真正的内容写在 \`AGENTS.md\`，让 \`CLAUDE.md\` 只有一行 \`@AGENTS.md\`。本站的代码库就是这么组织的。

## 生成初稿

\`\`\`text
/init
\`\`\`

它会扫项目结构生成一份初稿。**初稿只是起点**，自动生成的内容通常包含一堆「这个目录放 controller」之类 Claude 自己看一眼就知道的废话。真正值钱的是它猜不到的东西。

## 该写什么

判断标准只有一个：**Claude 读代码读不出来，但做错了会造成实际损失的东西。**

值得写：

\`\`\`markdown
## 命令
- 测试：\`bun run test\`（不是 npm，这个项目用 bun）
- 类型检查：\`bun run typecheck\`，改完 TS 必须跑
- 不要跑 \`bun run build\`，太慢，CI 会做

## 约定
- 所有 JSON 序列化走 \`common/json.go\` 的包装函数，不要直接 import encoding/json
- 数据库代码必须同时兼容 SQLite / MySQL / PostgreSQL
- 计费相关的数值转换只用 \`common/quota_math.go\` 里的辅助函数，禁止裸 int 转换

## 边界
- \`migrations/\` 下已提交的文件不要改，加新的
- 不要动 \`vendor/\` 和任何 \`*.gen.ts\`
\`\`\`

不值得写：

- 目录树说明（它自己会看）
- 「请写出高质量的代码」这类空话
- 完整的 API 文档（放单独文件，需要时让它读）
- 语言基础知识

## 三条经验

**第一，写成约束而不是描述。** 「用 bun 而不是 npm」比「这个项目使用 bun 作为包管理器」有效，因为前者是一条可以被违反的规则，后者只是一句陈述。

**第二，把踩过的坑写进去。** 每次 Claude 犯了同一个错第二次，就该往 \`CLAUDE.md\` 加一行。这是这份文件唯一正确的增长方式——由真实失败驱动，而不是一开始就想周全。

**第三，控制长度。** 它每轮对话都在上下文里。写到几百行就该考虑拆分：稳定的规则留在 \`CLAUDE.md\`，具体的领域知识挪到单独文件，需要时用 \`@\` 导入或者让 Claude 自己去读。

## 临时追加记忆

对话中想记一条，直接用 \`#\` 开头发消息：

\`\`\`text
# 这个项目的 lint 命令是 bun run lint，不是 eslint
\`\`\`

它会问你写到哪个文件（项目的还是全局的），然后追加进去。比手动开编辑器快得多，适合随手记。

## 路径级规则

\`.claude/rules/\` 下的文件可以在 frontmatter 里用 \`paths:\` 指定 glob，只在碰到匹配的文件时才加载：

\`\`\`markdown
---
paths:
  - "relay/channel/**"
---

新增渠道适配器时，确认上游是否支持 StreamOptions，
支持的话要把渠道加进 streamSupportedChannels。
\`\`\`

大项目里这个机制比什么都塞进 \`CLAUDE.md\` 高效得多——规则只在相关时才占上下文。

想看一份真实在用的完整文件，以及每段是被什么问题逼出来的，见[我的 CLAUDE.md](/docs/my-claude-md)。
`,
}
