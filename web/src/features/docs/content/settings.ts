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

export const settingsJson: DocChapter = {
  slug: 'settings-json',
  title: 'settings.json 全解',
  summary: '文件位置、优先级、权限规则、环境变量与模型配置。',
  keywords: [
    'settings.json',
    'permissions',
    '权限',
    'allow',
    'deny',
    'env',
    'bypassPermissions',
    'acceptEdits',
  ],
  build: (ctx) => `
# settings.json 全解

这是 Claude Code 的行为控制中心。搞懂它，你就能把「每一步都要点确认」的体验变成「该问的时候问，不该问的时候闭嘴」。

## 文件位置与优先级

从高到低，高优先级覆盖低优先级：

| 层级 | 路径 |
| --- | --- |
| 企业托管策略 | macOS \`/Library/Application Support/ClaudeCode/managed-settings.json\`；Linux \`/etc/claude-code/managed-settings.json\`；Windows \`C:\\Program Files\\ClaudeCode\\managed-settings.json\` |
| 命令行参数 | \`--settings\`、\`--model\` 等 |
| 项目本地 | \`.claude/settings.local.json\`（个人，默认不进 Git） |
| 项目共享 | \`.claude/settings.json\`（团队，提交到 Git） |
| 用户全局 | \`~/.claude/settings.json\` |

一个例外：**\`permissions.deny\` 规则在所有层级合并生效**，不会被高优先级覆盖掉。禁止就是禁止，这个设计是对的。

实践上的分工：全局放个人偏好和默认模型，项目共享放团队约定的权限和命令白名单，\`.local.json\` 放密钥和只属于你的东西。

## 一份实用的起点配置

\`~/.claude/settings.json\`：

\`\`\`json
{
  "env": {
    "ANTHROPIC_BASE_URL": "${ctx.baseUrl}",
    "ANTHROPIC_AUTH_TOKEN": "sk-你的密钥",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "32000"
  },
  "model": "claude-sonnet-4-5",
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(bun run test:*)",
      "Bash(bun run typecheck)",
      "Bash(bun run lint:*)",
      "Read(**)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(./secrets/**)",
      "Bash(git push:*)",
      "Bash(rm -rf:*)"
    ]
  },
  "statusLine": {
    "type": "command",
    "command": "~/.claude/ccline/ccline",
    "padding": 0
  },
  "includeCoAuthoredBy": false,
  "cleanupPeriodDays": 30
}
\`\`\`

逐项解释下面几节都有。

## permissions 规则语法

格式是 \`工具名(参数模式)\`：

\`\`\`json
"Bash(npm run test:*)"      // 允许 npm run test 开头的命令
"Bash(git diff:*)"          // 允许任意 git diff
"Read(./src/**)"            // 允许读 src 下所有文件
"Read(./.env)"              // 精确匹配单个文件
"Edit(./docs/**)"           // 限定只能改 docs
"WebFetch(https://api.example.com/*)"   // 限定可访问的域
\`\`\`

三种列表：

- \`allow\` — 直接执行，不问
- \`ask\` — 每次都问（用来给某些危险操作加显式确认）
- \`deny\` — 直接拒绝

**写 allow 规则的关键是够窄。** \`"Bash(git:*)"\` 看起来省事，但它把 \`git push --force\` 和 \`git reset --hard\` 一起放进来了。宁可多写几行精确的。

反过来，\`deny\` 里该拦的：读密钥文件、\`git push\`、\`rm -rf\`、生产环境部署命令。这些不是因为 Claude 会故意搞破坏，而是因为它可能在理解偏差下做出你没想要的操作，而这几类操作不可逆。

## 权限模式

\`Shift+Tab\` 循环切换，也可以在配置里定 \`defaultMode\`，或启动时 \`--permission-mode\`：

| 模式 | 行为 |
| --- | --- |
| \`default\` | 每个写操作和命令都问 |
| \`acceptEdits\` | 文件编辑自动通过，命令仍然问 |
| \`plan\` | 只研究和出方案，完全不动文件 |
| \`bypassPermissions\` | 全部跳过（保留 \`ask\` 规则和几条硬性保护） |

日常最舒服的是 \`acceptEdits\`：改代码不打断你，但要跑命令时还是会停下来确认。

\`plan\` 模式的价值被低估了。改动比较大的任务，先在 plan 模式让它把方案讲清楚，你审一遍再让它动手，比直接放手然后回滚要省时间。

\`bypassPermissions\` 只在两种情况下合理：一次性的沙箱容器里，或者你完全知道接下来要发生什么的批量操作。日常别开——不是怕它删库，是怕你失去了「哦这一步不对」的那个拦截点。

## env

\`env\` 里的键值会注入到 Claude Code 及其子进程的环境。用它比改 shell 配置文件干净，尤其是需要按项目区分配置时。

密钥放在这里要注意：如果这份文件会进 Git，密钥必须挪到 \`.claude/settings.local.json\`。

## 其他常用键

\`\`\`json
{
  "model": "claude-sonnet-4-5",
  "fallbackModel": "claude-haiku-4-5",
  "includeCoAuthoredBy": false,
  "cleanupPeriodDays": 30,
  "outputStyle": "default",
  "enableAllProjectMcpServers": true,
  "additionalDirectories": ["../shared-lib"]
}
\`\`\`

- \`includeCoAuthoredBy\` — 设 \`false\` 去掉 commit message 里的 Co-Authored-By 署名行。
- \`cleanupPeriodDays\` — 本地会话记录保留天数。
- \`additionalDirectories\` — 让 Claude 能访问项目目录之外的路径，monorepo 或者引用了同级仓库时需要。
- \`apiKeyHelper\` — 一条 shell 命令，输出凭据。密钥需要动态获取（比如从企业密钥管理服务取短期 token）时用，默认缓存 5 分钟。

## hooks

在特定事件上挂命令，做强制性的自动化。事件名包括 \`PreToolUse\`、\`PostToolUse\`、\`UserPromptSubmit\`、\`SessionStart\`、\`SessionEnd\`、\`Stop\`、\`SubagentStop\`、\`PreCompact\` 等。

最经典的用法是编辑后自动格式化：

\`\`\`json
{
  "hooks": {
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "cd $CLAUDE_PROJECT_DIR/web && bun run format"
          }
        ]
      }
    ]
  }
}
\`\`\`

hook 和「在 CLAUDE.md 里请求它记得格式化」的区别是：hook 是确定性的，一定会执行；写在 CLAUDE.md 里的只是提示，可能被忽略。**凡是必须每次都发生的事，都应该做成 hook。**

另一个好用的场景是 \`PreToolUse\` 加拦截逻辑，比如检测到要写入某些敏感路径就直接返回失败。

## 配置检查

\`\`\`bash
claude doctor
\`\`\`

会告诉你哪些配置文件被加载了、有没有语法错误。JSON 写错一个逗号会导致整份配置静默失效，改完记得跑一下。

想看一份实际在用的完整配置和每个取舍的理由，见[我的 settings.json](/docs/my-settings)。
`,
}
