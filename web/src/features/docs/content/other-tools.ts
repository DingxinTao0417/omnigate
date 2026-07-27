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

export const otherClis: DocChapter = {
  slug: 'other-clis',
  title: '其他终端工具',
  summary: 'Crush、aider、Gemini CLI、Droid 等的接入方式。',
  keywords: ['crush', 'aider', 'gemini cli', 'droid', 'cli', '终端'],
  build: (ctx) => `
# 其他终端工具

## Crush

Charm 出的终端 agent，界面做得很好看。

\`\`\`bash
brew install charmbracelet/tap/crush
# 或
npm i -g @charmland/crush
# 或 Windows
winget install charmbracelet.crush
\`\`\`

配置在 \`~/.config/crush/crush.json\`，项目级是 \`.crush.json\`：

\`\`\`json
{
  "providers": {
    "omnigate": {
      "type": "openai-compat",
      "base_url": "${ctx.baseUrl}/v1",
      "api_key": "$OMNIGATE_API_KEY",
      "models": [
        {
          "id": "claude-sonnet-4-5",
          "name": "Claude Sonnet 4.5",
          "context_window": 200000,
          "default_max_tokens": 32000
        }
      ]
    }
  }
}
\`\`\`

\`api_key\` 支持 \`$变量名\` 形式引用环境变量。

## aider

老牌的 Git 原生 AI 结对编程工具，改完自动 commit，回滚很方便。

\`\`\`bash
python -m pip install aider-install && aider-install
\`\`\`

接入靠环境变量，模型名要加 \`openai/\` 前缀（告诉 aider 用 OpenAI 协议，不是指模型真的来自 OpenAI）：

\`\`\`bash
export OPENAI_API_BASE="${ctx.baseUrl}/v1"
export OPENAI_API_KEY="sk-你的密钥"

aider --model openai/claude-sonnet-4-5
\`\`\`

也可以直接传参：\`aider --openai-api-base ... --openai-api-key ...\`。

## Factory Droid

\`~/.factory/settings.json\` 里加 \`customModels\`：

\`\`\`json
{
  "customModels": [
    {
      "displayName": "Claude Sonnet 4.5 (${ctx.siteName})",
      "model": "claude-sonnet-4-5",
      "baseUrl": "${ctx.baseUrl}/v1",
      "apiKey": "sk-你的密钥",
      "provider": "generic-chat-completion-api"
    }
  ]
}
\`\`\`

## Gemini CLI

这个得说清楚：**Gemini CLI 接不了 OpenAI 兼容网关。**

\`GOOGLE_GEMINI_BASE_URL\` 只是换了个请求地址，发出去的请求体仍然是 Google 原生的 \`generateContent\` 格式。官方也把「支持任意自定义端点」的需求关掉了（标记为 not planned）。

不过这一点目前影响不大：**本站暂时没有接入 Gemini 模型**，现在能用的是 Claude 和 GPT 两个系列。所以这一节留在这里只是备查，等以后接了 Gemini 再说。

## claude-code-router

如果你想要「不同任务自动路由到不同模型」，[musistudio/claude-code-router](https://github.com/musistudio/claude-code-router) 在本地起一个控制层，Claude Code 连它，它再按规则分发到多个后端。

\`\`\`bash
npm install -g @musistudio/claude-code-router
\`\`\`

适合的场景：想让日常问答走便宜模型、复杂重构走贵模型，而且不想手动 \`/model\`。代价是多了一个要维护的中间层——本站本身已经能在密钥层面做分组和限额，多数人不需要再套一层。
`,
}

export const guiClients: DocChapter = {
  slug: 'gui-clients',
  title: '桌面与 GUI 客户端',
  summary: 'Cherry Studio、CC Switch、Cline、Roo Code、Continue、Zed。',
  keywords: [
    'cherry studio',
    'cc switch',
    'cline',
    'roo code',
    'continue',
    'zed',
    'kilo code',
    'vscode',
    'gui',
    '桌面',
  ],
  build: (ctx) => `
# 桌面与 GUI 客户端

不想碰终端的话，这些图形界面工具都能接本站。

## Cherry Studio

跨平台桌面客户端，聊天、知识库、翻译都有，适合当日常主力。

1. 打开 [cherry-ai.com](https://cherry-ai.com) 下载安装。
2. 设置 → 模型服务 → 点「+ 添加」。
3. 提供商类型选 **OpenAI**。
4. API 地址填 \`${ctx.baseUrl}\`，API 密钥填你的 \`sk-\` 密钥。
5. 在模型列表里手动添加你要用的模型 ID，比如 \`claude-sonnet-4-5\`、\`gpt-5.1\`。
6. 点「检查」验证连通。

注意第 4 步的地址：Cherry Studio 会自己补 \`/v1\`，所以一般填到域名就行。如果检查失败，试试补成 \`${ctx.baseUrl}/v1\`——不同版本行为略有差异。

## CC Switch

[farion1231/cc-switch](https://github.com/farion1231/cc-switch)，专门解决「在多个 API 供应商之间来回切」的痛点。

它是个桌面应用，管理 Claude Code、Codex、OpenCode 等工具的多套配置，切换时直接改写这些工具的真实配置文件（\`~/.claude/settings.json\`、\`~/.codex/config.toml\`）。

同时有官方订阅和本站密钥、或者在几个网关之间比价的人，装这个能省掉大量手动编辑。从 [ccswitch.io](https://ccswitch.io) 或 GitHub Releases 下载。

## Cline / Roo Code / Kilo Code

三个都是 VS Code 扩展，操作路径几乎一样：

1. 在扩展市场装好，打开侧边栏。
2. 点设置齿轮。
3. **API Provider** 选 \`OpenAI Compatible\`。
4. Base URL 填 \`${ctx.baseUrl}/v1\`。
5. API Key 填你的密钥。
6. Model ID 手填，比如 \`claude-sonnet-4-5\`。

一个坑：**Roo Code 要求模型支持原生 tool calling**，它没有 XML 格式的降级方案。选模型时避开那些不支持函数调用的。

Cline 如果你想走 Anthropic 原生协议而不是 OpenAI 兼容，Provider 选 \`Anthropic\`，Base URL 填 \`${ctx.baseUrl}\`（不带 \`/v1\`）。

## Continue

配置现在用 YAML（\`config.json\` 已废弃）。编辑 \`~/.continue/config.yaml\`：

\`\`\`yaml
models:
  - name: Claude Sonnet 4.5
    provider: openai
    model: claude-sonnet-4-5
    apiBase: ${ctx.baseUrl}/v1
    apiKey: sk-你的密钥
    roles: [chat, edit, apply]

  - name: Haiku (autocomplete)
    provider: openai
    model: claude-haiku-4-5
    apiBase: ${ctx.baseUrl}/v1
    apiKey: sk-你的密钥
    roles: [autocomplete]
\`\`\`

\`roles\` 决定这个模型用在哪：\`chat\` 对话、\`edit\` 改代码、\`autocomplete\` 行内补全。补全用小模型，因为它触发得非常频繁。

## Zed

编辑 \`~/.config/zed/settings.json\`。注意键名是 \`openai_compatible\`，不是 \`openai\`：

\`\`\`json
{
  "language_models": {
    "openai_compatible": {
      "omnigate": {
        "api_url": "${ctx.baseUrl}/v1",
        "available_models": [
          {
            "name": "claude-sonnet-4-5",
            "display_name": "Claude Sonnet 4.5",
            "max_tokens": 200000
          }
        ]
      }
    }
  }
}
\`\`\`

密钥不写在这个文件里。Zed 走系统钥匙串，在设置界面里填；或者设环境变量 \`OMNIGATE_API_KEY\`（规则是 provider id 转大写下划线再加 \`_API_KEY\`）。
`,
}
