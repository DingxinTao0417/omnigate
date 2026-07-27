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

export const introduction: DocChapter = {
  slug: 'introduction',
  title: '快速开始',
  summary: '五分钟内拿到密钥并发出第一个请求。',
  keywords: ['intro', 'quickstart', '入门', '开始', 'base url', '密钥'],
  build: (ctx) => `
# 快速开始

${ctx.siteName} 是一个 AI API 中转网关。你只需要一个密钥、一个 Base URL，就能在几十种客户端里调用 Claude 和 GPT 系列模型，不用为每家厂商单独注册、充值、配置。

## 三步接入

**第一步，创建密钥。** 打开 [控制台 → API 密钥](/keys)，点「新建」，复制生成的 \`sk-\` 开头的字符串。这个值只在创建时完整显示一次，请立刻存好。

**第二步，记住你的 Base URL。**

| 用途 | 地址 |
| --- | --- |
| OpenAI 兼容（绝大多数工具） | \`${ctx.baseUrl}/v1\` |
| Anthropic 兼容（Claude Code 等） | \`${ctx.baseUrl}\` |

注意 OpenAI 格式的地址结尾是 \`/v1\`，而 Anthropic 格式**不带** \`/v1\`（客户端自己会补上 \`/v1/messages\`）。填错这一处是新手最常见的失败原因，详见[常见问题](/docs/troubleshooting)。

**第三步，验证连通性。** 把下面这段贴进终端，替换掉密钥：

\`\`\`bash
curl ${ctx.baseUrl}/v1/chat/completions \\
  -H "Authorization: Bearer sk-你的密钥" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "gpt-5.1",
    "messages": [{"role": "user", "content": "只回复两个字：连通"}]
  }'
\`\`\`

看到正常的 JSON 回复就说明通了。如果返回 401，密钥或 \`Authorization\` 头有问题；如果返回模型不存在，去[模型广场](/pricing)确认模型名的准确拼写。

## 接下来去哪

- 想装 AI 编程工具（Claude Code、Codex、OpenCode 等），从[环境准备](/docs/prerequisites)开始，然后是[安装 Claude Code](/docs/claude-code)。
- 只想在图形界面里聊天，看[桌面与 GUI 客户端](/docs/gui-clients)。
- 想把 Claude Code 用到极致，看[Claude Code 进阶](/docs/claude-code-advanced)。

跑通之后建议回来看一眼**站主实践**那一组：[AI 使用心得](/docs/insights)、[我的 CLAUDE.md](/docs/my-claude-md)、[我的 settings.json](/docs/my-settings)。那几篇是主观经验和真实在用的配置，不是操作步骤——**现在读用不上，用过几天再读会省下不少钱和返工**。

## 关于计费

网关按 token 计费，价格随模型不同，具体倍率在[模型广场](/pricing)查询。每次请求的实际消耗可以在[用量日志](/usage-logs)里逐条核对，包括输入、输出、缓存命中和推理 token 的拆分。

缓存是省钱的关键：命中缓存的输入 token 通常只按一个很低的折扣计费。这也是为什么在 Claude Code 里频繁 \`/clear\` 反而更贵——详见[AI 使用心得](/docs/insights)。
`,
}

export const concepts: DocChapter = {
  slug: 'concepts',
  title: '核心概念',
  summary: '协议格式、模型名、分组、密钥的作用范围。',
  keywords: ['概念', 'protocol', '协议', 'group', '分组', 'token', 'quota'],
  build: (ctx) => `
# 核心概念

理解这几件事，后面所有工具的配置就都是同一套东西的变体。

## 协议格式

不同厂商的 HTTP 接口长得不一样。网关同时说下面这几种「方言」，客户端用哪种就配哪个地址：

| 格式 | Base URL | 典型端点 | 谁在用 |
| --- | --- | --- | --- |
| OpenAI Chat Completions | \`${ctx.baseUrl}/v1\` | \`/chat/completions\` | 绝大多数工具、SDK |
| OpenAI Responses | \`${ctx.baseUrl}/v1\` | \`/responses\` | Codex CLI、新版 OpenAI SDK |
| Anthropic Messages | \`${ctx.baseUrl}\` | \`/v1/messages\` | Claude Code、Cline 的 Anthropic 模式 |
| Google Gemini | \`${ctx.baseUrl}/v1beta\` | \`/models/*\` | Gemini SDK |

关键点：**协议格式和模型厂商是两件独立的事**。你可以用 OpenAI 格式去请求 \`claude-sonnet-4-5\`，网关会在中间做转换。所以一个只支持「OpenAI 兼容」的老工具，照样能用上 Claude。

上面列的 Gemini 协议是网关支持的格式，不代表已接入 Gemini 模型——目前只接了 Claude 和 GPT 两个系列。

反过来也成立：Claude Code 只会说 Anthropic 方言，但通过网关，它背后跑的可以是任何已接入的模型，包括 GPT 系列。

## 模型名要写准

模型名是字符串匹配，不做模糊纠正。\`gpt-5.1\` 和 \`gpt-5-1\` 是两个不同的东西，后者会直接报错。可靠的做法是从[模型广场](/pricing)复制，或者调接口列出当前可用的全部模型：

\`\`\`bash
curl ${ctx.baseUrl}/v1/models \\
  -H "Authorization: Bearer sk-你的密钥"
\`\`\`

## 密钥、分组与额度

- **密钥（Token）**：你创建的 \`sk-\` 字符串，代表一次授权。可以创建多个，分别设置额度上限、过期时间、可用模型范围和 IP 白名单。建议按用途分开——一个给 Claude Code，一个给脚本，一个给你在测的应用。哪个泄露了单独删掉就行，不影响其他。
- **分组（Group）**：决定你走哪一档线路和价格倍率。默认分组通常就够用，有特殊需求再看[模型广场](/pricing)上的分组说明。
- **额度（Quota）**：账户余额，按 token 消耗扣减。在[钱包](/wallet)充值和查看。

## 流式输出

编程类工具几乎都用流式（SSE）。网关默认支持，请求里带 \`"stream": true\` 即可。如果你自己部署了反向代理，务必关闭响应缓冲，否则 token 会攒成一批一批地吐出来，看起来像卡住。

## 用量核对

每一次调用都会在[用量日志](/usage-logs)留下一条记录，包含模型、输入/输出 token、缓存命中、实际扣费。怀疑某个工具在偷偷刷请求时，这里是唯一的事实来源。
`,
}
