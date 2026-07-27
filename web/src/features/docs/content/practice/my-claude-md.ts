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
import type { DocChapter } from '../../types'
import { buildPracticeIntro } from './preamble'

export const myClaudeMd: DocChapter = {
  slug: 'my-claude-md',
  title: '我的 CLAUDE.md',
  summary: '一份真实在用的全局 CLAUDE.md，逐段说明为什么这么写。',
  keywords: ['CLAUDE.md', '配置', '记忆', 'memory', '全局', '实例', '模板'],
  build: () => `
# 我的 CLAUDE.md

${buildPracticeIntro({
  solves: '不知道 CLAUDE.md 该写什么、写多少才算够。',
  fits: '想看一份真实在用的文件，而不是「最佳实践」清单。',
  avoid:
    '想直接整份复制的人 —— 里面一半是我的个人偏好，另一半只对特定项目成立，照抄会让它按错误的约定干活。',
})}

语法和加载顺序在[CLAUDE.md 怎么写](/docs/claude-md)那章，这里只讲我实际写了什么、以及每段是被什么问题逼出来的。

## 全局那一份

放 \`~/.claude/CLAUDE.md\`，对所有项目生效。我的很短：

\`\`\`markdown
## 通用

- 用简体中文回复。
- 代码注释保持精简，且用英文。
- 改完 TypeScript 一定要跑类型检查，有错修到没错为止。
- 不确定的时候先问，不要猜着往下写。

## 文件写入

单个文件超过 200 行时，分多次 Edit 追加，不要一次 Write 写完 ——
一次写太大容易中途失败，留下半个文件。
\`\`\`

就这些。全局文件我刻意压得很短，因为它对每个项目都生效，写多了就是在给所有对话交固定的 token 税。

值得说的是最后那条「文件写入」。这不是什么通用真理，是我自己踩出来的：大文件一次性写入失败过几次，留下截断的半个文件，比报错更难发现。所以这条只是**我的环境下的一个规避手段**,别人不一定需要。

## 项目那一份

项目根目录的 \`CLAUDE.md\`,我通常只写一行：

\`\`\`markdown
@AGENTS.md
\`\`\`

原因是 Codex 和 OpenCode 读 \`AGENTS.md\`,Claude Code 读 \`CLAUDE.md\`。把真内容写在 \`AGENTS.md\`、让 \`CLAUDE.md\` 导入它，三个工具就共用同一份规则，不用维护两份。

## 项目规则里我真正会写的四类

拿本站的代码库举例。它是 Go 后端加 React 前端，规则不少，但都能归到这四类：

**第一类，命令。** 这是收益最高的一类，因为它猜不到：

\`\`\`markdown
- 前端包管理用 bun,不是 npm/yarn/pnpm
- 类型检查:\`bun run typecheck\`
- lint:\`bun run lint\`
- 改完 TS/TSX 必须跑 typecheck,不得遗留错误
\`\`\`

不写这段，它会默认用 \`npm\`,然后你得到一个和 \`bun.lock\` 冲突的 \`package-lock.json\`。

**第二类，项目特有的强制约定。** 判断标准是「违反了会出 bug 但代码看起来正常」：

\`\`\`markdown
- 所有 JSON 序列化必须走 common/json.go 的包装函数,
  禁止在业务代码里直接 import encoding/json
- 数据库代码必须同时兼容 SQLite / MySQL 5.7.8+ / PostgreSQL 9.6+
- 行锁统一用 lockForUpdate(tx);GORM v2 会静默忽略旧版写法,
  写错了不报错但锁根本没加上
\`\`\`

最后那条是这类规则的典型：**错误的写法不会报错，只会让锁失效。** 这种东西不写进去，它照着网上的老例子写，你 review 也很难看出来。

**第三类，禁区。** 明确不能碰的：

\`\`\`markdown
- 不要修改已提交的 migration 文件,加新的
- 不要动任何 *.gen.ts(自动生成)
- 计费相关的数值转换只用 common/quota_math.go 里的辅助函数,
  禁止裸 int() 强转
\`\`\`

**第四类，踩过的坑。** 这一类是逐渐长出来的，不是一开始写的。规则是：**同一个错误犯第二次，就往这里加一行。**

比如「布尔字段不要用 gorm \`default:true\` 标签」这条，起因是 MySQL 和 PostgreSQL 对布尔默认值的处理不一致，导致每次重启都触发一次多余的 \`ALTER TABLE\`。这种事没人能提前想到，只能撞上一次然后记下来。

## 我不写的东西

同样重要：

- **目录结构说明。** 它自己会看，写了纯占 token。
- **「请写高质量代码」这类话。** 没有任何可执行含义。
- **完整 API 文档。** 放单独文件，需要时让它读或用 \`@\` 导入。
- **语言基础。** 它比我熟。

## 长度控制

我的项目 \`AGENTS.md\` 现在两百多行，已经接近我能接受的上限。再长就该拆：

稳定的强制约定留在主文件，领域知识挪到 \`.claude/rules/\` 下按路径加载。比如渠道适配器的规则只在改 \`relay/channel/**\` 时才需要：

\`\`\`markdown
---
paths:
  - "relay/channel/**"
---

新增渠道时确认上游是否支持 StreamOptions,
支持的话要把渠道加进 streamSupportedChannels。
\`\`\`

这样它平时不占上下文，碰到相关文件才加载。项目一大，这个机制比什么都塞进主文件高效得多。

## 怎么开始你自己的

别想着一次写完美。我的做法：

1. \`/init\` 生成初稿，然后**把自动生成的目录说明全删掉**。
2. 补上命令那一段。这一步收益最大。
3. 之后每次它犯了同一个错第二次，加一行。

第三步是关键。由真实失败驱动的规则，每一条都有实际价值；一开始凭想象写周全的，大半是废话。
`,
}
