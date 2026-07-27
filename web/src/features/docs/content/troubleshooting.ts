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

export const troubleshooting: DocChapter = {
  slug: 'troubleshooting',
  title: '常见问题',
  summary: '连不上、401、模型不存在、环境变量不生效的排查顺序。',
  keywords: ['问题', 'faq', 'troubleshoot', '排查', '401', '报错', '不生效'],
  build: (ctx) => `
# 常见问题

## 先按这个顺序排查

九成的问题在前三步就解决了。

**第一步，用 curl 直连。** 绕开所有工具，确认网关和密钥本身没问题：

\`\`\`bash
curl ${ctx.baseUrl}/v1/models -H "Authorization: Bearer sk-你的密钥"
\`\`\`

这一步失败 → 密钥或网络问题。成功 → 问题在客户端配置。

**第二步，检查 Base URL 的 \`/v1\`。** 这是最高频的错误：

- OpenAI 兼容 → \`${ctx.baseUrl}/v1\`
- Anthropic 兼容 → \`${ctx.baseUrl}\`（不带 \`/v1\`）

多写一层变成 \`/v1/v1/chat/completions\` 会 404，少写一层也会。

**第三步，确认环境变量真的生效了。**

\`\`\`bash
# macOS / Linux
echo $ANTHROPIC_BASE_URL

# Windows PowerShell
$env:ANTHROPIC_BASE_URL
\`\`\`

打印为空说明没生效。\`setx\` 之后必须新开终端；改了 \`~/.zshrc\` 要么 \`source\` 一下要么新开终端。

## 具体错误

**401 Unauthorized**

密钥不对。检查有没有多余空格、有没有把 \`Bearer \` 前缀漏掉或写重复。从控制台重新复制一次最稳妥。也确认下密钥没过期、没被删。

**402 / 额度不足**

余额用完了，去[钱包](/wallet)。

**404 / 模型不存在**

模型名拼错，或者你的分组不包含这个模型。用上面第一步的 \`/v1/models\` 看实际可用列表，直接复制粘贴，不要手打。

**429 限流**

请求太密。加退避重试。如果是长期稳定超限，看下密钥的限流设置。

**流式输出一卡一卡地出来**

如果你在网关和客户端之间加了自己的反向代理，检查有没有关掉响应缓冲。Nginx 需要 \`proxy_buffering off\`，Caddy 需要 \`flush_interval -1\`。

**Claude Code 启动时弹出确认框**

你设了 \`ANTHROPIC_API_KEY\`。改用 \`ANTHROPIC_AUTH_TOKEN\` 就不会弹。两个不要同时设。

**Codex 启动失败或报 wire_api 相关错误**

配置里的 \`wire_api\` 如果是 \`"chat"\`，改成 \`"responses"\`。Chat Completions 那套已经被 Codex 废弃了，老教程都是过期的。

**Roo Code 报工具调用相关的错**

Roo Code 要求模型支持原生 function calling，没有降级方案。换一个支持的模型。

**Gemini CLI 怎么都连不上**

连不上是正常的，它不支持自定义 OpenAI 兼容端点，\`GOOGLE_GEMINI_BASE_URL\` 只换地址不换协议。

另外本站目前也没有接入 Gemini 模型，现在能用的是 Claude 和 GPT 两个系列，所以这个工具暂时用不上。

**npm 全局安装报权限错误**

不要用 \`sudo npm install -g\`。装个 fnm 或 nvm 管理 Node，全局包就装在你自己的目录下，不需要提权。详见[环境准备](/docs/prerequisites)。

## 怎么确认钱花在哪了

[用量日志](/usage-logs)是唯一的事实来源。每条记录包含模型、输入/输出/缓存 token 的拆分和实际扣费。

客户端侧的用量统计工具（ccusage 之类）是从本地会话文件估算的，和网关侧的真实计费可能有差异。对不上时以网关为准。

## 还是不行

带上这些信息[联系我们](/about)：

- 用的什么客户端、什么版本
- 完整的报错信息
- 一条能复现的 curl 命令（**把密钥换成 \`sk-xxx\`**）
- 大致的出错时间，方便对日志

不要在任何地方粘贴完整密钥，包括发给我们。
`,
}
