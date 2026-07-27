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

export const codex: DocChapter = {
  slug: 'codex',
  title: '安装 Codex CLI',
  summary: 'OpenAI 官方 CLI，config.toml 自定义 provider 配置。',
  keywords: ['codex', 'openai', 'config.toml', 'wire_api', 'responses', '安装'],
  build: (ctx) => `
# 安装 Codex CLI

Codex 是 OpenAI 官方的终端 agent。它的配置比 Claude Code 复杂一点，因为要在 TOML 里显式声明一个自定义 provider。

## 安装

**npm（跨平台）：**

\`\`\`bash
npm install -g @openai/codex
\`\`\`

**Homebrew（macOS）：**

\`\`\`bash
brew install --cask codex
\`\`\`

**独立安装脚本（macOS / Linux）：**

\`\`\`bash
curl -fsSL https://chatgpt.com/codex/install.sh | sh
\`\`\`

**Windows PowerShell：**

\`\`\`powershell
powershell -ExecutionPolicy ByPass -c "irm https://chatgpt.com/codex/install.ps1 | iex"
\`\`\`

Windows 现在是原生支持，不再需要 WSL。也可以直接从 [GitHub Releases](https://github.com/openai/codex/releases/latest) 下二进制。

## 先说一个重要前提

Codex 的 \`wire_api\` 决定它用哪种协议说话。**旧的 \`"chat"\`（Chat Completions）已经被官方废弃**，2026 年初起的版本里填 \`"chat"\` 可能直接启动失败。现在应当填 \`"responses"\`。

这意味着接入本站时要走 Responses 协议（\`${ctx.baseUrl}/v1/responses\`）。本站支持这个端点，所以下面的配置是可用的；但如果你看到别处的老教程写着 \`wire_api = "chat"\`，那是过期信息。

## 配置

编辑 \`~/.codex/config.toml\`（Windows 是 \`C:\\Users\\你的用户名\\.codex\\config.toml\`），没有就新建：

\`\`\`toml
model_provider = "omnigate"
model = "gpt-5.1"
model_reasoning_effort = "medium"
approval_policy = "on-request"
sandbox_mode = "workspace-write"

[model_providers.omnigate]
name     = "${ctx.siteName}"
base_url = "${ctx.baseUrl}/v1"
env_key  = "OMNIGATE_API_KEY"
wire_api = "responses"
\`\`\`

\`env_key\` 不是密钥本身，而是**存放密钥的环境变量名**。所以还要：

\`\`\`bash
# macOS / Linux
echo 'export OMNIGATE_API_KEY="sk-你的密钥"' >> ~/.zshrc
source ~/.zshrc
\`\`\`

\`\`\`powershell
# Windows
setx OMNIGATE_API_KEY "sk-你的密钥"
\`\`\`

然后新开终端，进项目目录：

\`\`\`bash
codex
\`\`\`

## 配置项说明

| 键 | 可选值 | 说明 |
| --- | --- | --- |
| \`model_provider\` | provider id | 指向下面 \`[model_providers.*]\` 里的某一项 |
| \`model_reasoning_effort\` | \`minimal\` \`low\` \`medium\` \`high\` \`xhigh\` | 推理投入，越高越慢越贵 |
| \`approval_policy\` | \`untrusted\` \`on-request\` \`never\` | 执行命令前是否问你 |
| \`sandbox_mode\` | \`read-only\` \`workspace-write\` \`danger-full-access\` | 文件系统写入范围 |
| \`model_context_window\` | 数字 | 手动指定上下文窗口，网关模型识别不准时用 |

\`[model_providers.*]\` 里还支持 \`http_headers\`（固定头）和 \`env_http_headers\`（从环境变量取值的头），需要传自定义头时用得上。

## 多套配置

Codex 的 profile 不是嵌套表，而是**独立文件**：\`~/.codex/<名字>.config.toml\`。用 \`--profile\` 选：

\`\`\`bash
codex --profile omnigate
\`\`\`

## 常用命令

\`\`\`bash
codex                      # 交互模式
codex exec "跑一遍测试并修掉失败的"   # 非交互，一次性执行
codex -m gpt-5.1           # 临时指定模型
codex -c model_reasoning_effort=high   # 临时覆盖任意配置项
codex --yolo               # 跳过所有确认和沙箱，慎用
codex mcp add ...          # 管理 MCP 服务
\`\`\`

\`--full-auto\` 已废弃，现在用 \`--yolo\`（完整名字是 \`--dangerously-bypass-approvals-and-sandbox\`，取这么长就是想让你犹豫一下）。

## AGENTS.md

Codex 会自动读 \`AGENTS.md\`：从项目根目录一路读到当前目录，外加全局的 \`~/.codex/AGENTS.md\`，全部拼接，离当前目录越近的优先级越高。

这和 Claude Code 的 \`CLAUDE.md\` 是同一类东西。想让两个工具共用一份规则，最省事的做法是让 \`CLAUDE.md\` 只写一行 \`@AGENTS.md\` 来导入——本站的代码库就是这么干的。
`,
}

export const opencode: DocChapter = {
  slug: 'opencode',
  title: '安装 OpenCode',
  summary: '开源终端 agent，JSON 配置任意 provider。',
  keywords: ['opencode', 'sst', 'anomalyco', 'openai-compatible', '安装'],
  build: (ctx) => `
# 安装 OpenCode

OpenCode 是开源的终端 agent，最大的优点是 provider 配置非常直白——一段 JSON 就能接任何 OpenAI 兼容或 Anthropic 兼容的端点，并且能在一份配置里同时挂多个模型来源。

仓库现在在 [anomalyco/opencode](https://github.com/anomalyco/opencode)（原 \`sst/opencode\` 会跳转过去）。

## 安装

\`\`\`bash
# 安装脚本，macOS / Linux
curl -fsSL https://opencode.ai/install | bash

# npm / bun，跨平台
npm i -g opencode-ai@latest

# Homebrew
brew install opencode
\`\`\`

**Windows：**

\`\`\`powershell
scoop install opencode
# 或
choco install opencode
\`\`\`

## 配置

全局配置在 \`~/.config/opencode/opencode.json\`，项目级放项目根目录的 \`opencode.json\`。

\`\`\`json
{
  "$schema": "https://opencode.ai/config.json",
  "provider": {
    "omnigate": {
      "npm": "@ai-sdk/openai-compatible",
      "name": "${ctx.siteName}",
      "options": {
        "baseURL": "${ctx.baseUrl}/v1",
        "apiKey": "{env:OMNIGATE_API_KEY}"
      },
      "models": {
        "gpt-5.1": {
          "name": "GPT-5.1",
          "limit": { "context": 400000, "output": 128000 }
        },
        "claude-sonnet-4-5": {
          "name": "Claude Sonnet 4.5",
          "limit": { "context": 200000, "output": 64000 }
        },
        "claude-haiku-4-5": {
          "name": "Claude Haiku 4.5",
          "limit": { "context": 200000, "output": 32000 }
        }
      }
    }
  },
  "model": "omnigate/claude-sonnet-4-5",
  "small_model": "omnigate/claude-haiku-4-5"
}
\`\`\`

配置里任何字符串都支持 \`{env:变量名}\` 取环境变量，所以密钥不用写死在文件里：

\`\`\`bash
echo 'export OMNIGATE_API_KEY="sk-你的密钥"' >> ~/.zshrc
source ~/.zshrc
\`\`\`

要点：

- \`npm\` 选适配器。OpenAI 格式用 \`@ai-sdk/openai-compatible\`，想走 Anthropic 格式就换成 \`@ai-sdk/anthropic\`（此时 \`baseURL\` 去掉 \`/v1\`）。
- \`model\` 的格式是 \`provider-id/模型名\`，前半截要和 \`provider\` 下的 key 对上。
- \`small_model\` 是干杂活的小模型（生成标题、摘要之类）。指一个便宜的，能明显压低总开销。
- \`models\` 里列出来的才会出现在选择列表里，得手动加。\`limit\` 可以不填，但填了之后上下文管理会更准。

\`opencode auth login\` 里的「Other」选项只会把凭据存进 \`~/.local/share/opencode/auth.json\`，**不会**帮你生成上面那段 \`provider\` 配置，该写还是得写。

## 其他能力

- **AGENTS.md**：自动读取，找不到时会退回读 \`CLAUDE.md\`。想关掉这个回退：\`OPENCODE_DISABLE_CLAUDE_CODE=1\`。
- **自定义命令**：\`.opencode/commands/\` 下放 Markdown，文件名就是 \`/命令名\`。
- **子 agent**：写在 \`opencode.json\` 的 \`agent\` 字段，或者 \`.opencode/agents/\` 下的 Markdown + frontmatter。
- **MCP**：顶层 \`mcp\` 字段，\`type\` 填 \`local\` 或 \`remote\`。
`,
}
