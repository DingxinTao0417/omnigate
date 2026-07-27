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

export const claudeCodeAdvanced: DocChapter = {
  slug: 'claude-code-advanced',
  title: 'Claude Code 进阶',
  summary: '自定义命令、子 agent、Skills、计划模式、无头模式。',
  keywords: [
    'slash command',
    '自定义命令',
    'subagent',
    '子agent',
    'skills',
    'plan mode',
    'headless',
    'rewind',
    '进阶',
  ],
  build: () => `
# Claude Code 进阶

装好之后能用，但和用得好之间还差这几样东西。按投入产出排序：自定义命令 → 计划模式 → 子 agent → Skills。

## 自定义斜杠命令

把重复输入的长 prompt 存成文件。放 \`.claude/commands/\`（项目级）或 \`~/.claude/commands/\`（全局），文件名就是命令名。

\`.claude/commands/review.md\`：

\`\`\`markdown
---
description: 审查当前改动
argument-hint: [关注点]
allowed-tools: Bash(git diff:*), Bash(git status), Read
---

当前改动：

!\`git diff HEAD\`

请审查上面的 diff，重点关注 $ARGUMENTS。
只报告真实的缺陷，不要提风格问题。每条给出文件、行号和具体的失败场景。
\`\`\`

用的时候：\`/review 并发安全\`。

三个关键语法：

- \`$ARGUMENTS\` — 命令后面跟的全部文字。也可以用 \`$1\`、\`$2\` 取单个位置参数。
- 感叹号加反引号包住的命令 — 在 prompt 组装时执行 shell 命令，把输出嵌进去。上面例子里 git diff 的结果是直接作为文本喂进去的，不需要 Claude 自己再去调工具，省一轮往返。
- \`@文件路径\` — 直接嵌入文件内容。

frontmatter 里 \`allowed-tools\` 限定这个命令能用什么工具，\`model\` 可以指定用哪个模型跑（简单命令指给便宜模型）。

**这是性价比最高的一个功能。** 你每天重复输入的那三五段话，做成命令之后不光省打字，还因为文字固定下来了而变得更精确——因为你会去打磨它。

## 计划模式

\`Shift+Tab\` 切到 plan 模式，或者启动时 \`--permission-mode plan\`。

这个模式下它只读文件、只做分析，产出一份方案，不动任何东西。你审完方案再放它去实施。

适用的判断标准：**改动会碰到三个以上文件，或者你自己也不完全确定该怎么改**。这两种情况下直接开干的返工率很高，而看一份方案只要一分钟。

## 子 agent

把一类任务交给独立上下文的 agent 去做。放 \`.claude/agents/\` 或 \`~/.claude/agents/\`。

\`.claude/agents/test-fixer.md\`：

\`\`\`markdown
---
name: test-fixer
description: 当测试失败需要定位和修复时使用。会跑测试、读失败信息、改代码、重跑验证。
tools: Read, Edit, Bash, Grep, Glob
model: sonnet
---

你负责修复失败的测试。

流程：
1. 跑测试拿到完整失败输出
2. 读相关代码定位根因
3. 判断是测试写错了还是实现写错了 —— 不要为了让测试通过而削弱断言
4. 改完重跑确认

如果失败原因是环境问题（缺依赖、端口占用），直接报告，不要试图绕过。
\`\`\`

子 agent 的真正价值是**上下文隔离**。主对话在做一件复杂的事，你不想让「跑测试看到 500 行报错输出」把主上下文塞满。子 agent 在自己的上下文里折腾完，只把结论返回来。

frontmatter 里 \`tools\` 限定工具范围，\`model\` 指定模型，\`isolation: worktree\` 可以让它在独立的 git worktree 里工作（并行改文件时避免冲突）。

用 \`/agents\` 可以交互式创建和管理。

## Skills

Skills 比命令更「自动」：命令要你主动打 \`/xxx\`，Skill 是 Claude 判断当前场景需要时自己加载。

\`.claude/skills/db-migration/SKILL.md\`：

\`\`\`markdown
---
name: db-migration
description: 编写数据库迁移时使用
when_to_use: 用户要求增删改数据库表结构、字段或索引时
---

本项目的迁移必须同时兼容 SQLite、MySQL 5.7.8+、PostgreSQL 9.6+。

规则：
- SQLite 不支持 ALTER COLUMN，只能 ADD COLUMN
- 主键交给 ORM 生成，不要写 AUTO_INCREMENT 或 SERIAL
- 保留字列名（group、key）用 model/main.go 里的 commonGroupCol、commonKeyCol
- 布尔默认值不要用 gorm default 标签，在代码里设
\`\`\`

Skill 的目录里还可以放脚本和模板文件，Claude 会按需读取。这让它比纯文本规则更强——你可以附上一个「正确的迁移文件模板」让它照着改。

判断该用哪个：**每次都要显式触发的用命令，希望它在特定情况下自动想起来的用 Skill。**

## MCP：给它接外部能力

MCP 让 Claude Code 连上外部工具和数据源。几个真正常用的：

\`\`\`bash
# 查库文档，避免它凭记忆写过时的 API
claude mcp add context7 -- npx -y @upstash/context7-mcp

# 控制浏览器，前端调试和 E2E 必备
claude mcp add playwright -- npx -y @playwright/mcp@latest

# Chrome DevTools，看控制台、网络请求、性能
claude mcp add chrome-devtools -- npx -y chrome-devtools-mcp@latest

# 顺序思考，复杂推理时有帮助
claude mcp add sequential-thinking -- npx -y @modelcontextprotocol/server-sequential-thinking
\`\`\`

GitHub 官方远程服务：

\`\`\`bash
claude mcp add --transport http github https://api.githubcopilot.com/mcp/ \\
  --header "Authorization: Bearer 你的GitHub_PAT"
\`\`\`

项目级共享配置写 \`.mcp.json\`（提交到 Git，团队共用）：

\`\`\`json
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp@latest"],
      "env": {}
    }
  }
}
\`\`\`

HTTP 类型的条目必须显式写 \`"type": "http"\`，只给 \`url\` 不给 \`type\` 会被当成配置错误。

\`/mcp\` 查看当前连接状态。

一个提醒：**MCP 服务的工具定义会占上下文**。挂十个服务，光工具描述就吃掉几千 token，而且选择变多之后它挑工具反而容易挑错。按项目只开需要的。

另外，通过第三方网关使用时（也就是设了 \`ANTHROPIC_BASE_URL\` 的情况），部分依赖 Anthropic 官方服务的功能会被自动关闭，MCP 工具搜索是其中之一。这不影响 MCP 本身工作。

## 插件市场

\`\`\`text
/plugin marketplace add wshobson/agents
/plugin install <插件名>@agents
/reload-plugins
\`\`\`

几个值得看的集合：

- [wshobson/agents](https://github.com/wshobson/agents) — 大量现成的 agent 和命令，质量不错
- [davila7/claude-code-templates](https://github.com/davila7/claude-code-templates) — \`npx claude-code-templates@latest\` 交互式挑选安装
- [hesreallyhim/awesome-claude-code](https://github.com/hesreallyhim/awesome-claude-code) — 精选列表，先看这个再决定装什么

**关于 everything-claude-code。** 这个仓库最近很火，号称几十万 star（这个数字本身相当可疑，不合常理），内容是几百个 agent、skill 和命令的大合集。它确实有能用的东西，但要注意两件事：一是网上出现了同名的恶意克隆仓库，装了会执行混淆的恶意脚本，**只从原仓库用 git clone，绝不下载 ZIP 双击安装包**；二是原仓库本身包含几十个自动执行的 hook 和几百个自动加载的指令文件，这是个不小的攻击面。

想用的话，建议只挑你看得懂的单个文件复制过来，不要整套装。这个原则适用于所有第三方 agent 集合：**别人的 hook 会在你的机器上以你的权限运行**。

## 无头模式

写进 CI 或脚本：

\`\`\`bash
claude -p "把所有 TODO 注释整理成一份清单" --output-format json

claude -p "修复 lint 错误" \\
  --allowedTools "Read,Edit,Bash(bun run lint:*)" \\
  --permission-mode acceptEdits
\`\`\`

\`--output-format stream-json\` 可以流式拿结构化输出，方便接后续处理。

CI 场景务必显式列 \`--allowedTools\`，不要图省事开 \`bypassPermissions\`——CI 环境往往有比你本机更敏感的凭据。

## 检查点与回滚

\`\`\`text
/rewind
\`\`\`

回到之前某个检查点的文件状态。它改坏了一片东西的时候，这比手动 \`git checkout\` 快，而且能精确到某一轮对话之后的状态。

前提是你得知道它存在——很多人不知道，然后在出问题时手忙脚乱地找 undo。

## 一些零碎但有用的

| 操作 | 用途 |
| --- | --- |
| \`/context\` | 看上下文构成，什么东西占了多少 |
| \`/compact\` | 压缩历史。比 \`/clear\` 好，保留了要点 |
| \`/export\` | 导出当前对话 |
| \`/resume\` | 恢复之前的会话 |
| \`--add-dir <路径>\` | 临时让它访问额外目录 |
| \`/vim\` | vim 键位编辑模式 |
| 拖拽图片进终端 | 直接贴设计图、报错截图 |
| \`Esc\` 两次 | 打断并回到上一条消息 |

想让它多思考一点，在 prompt 里明确要求深入分析就行。复杂问题上这个投入通常划得来，简单问题上纯属浪费。
`,
}
