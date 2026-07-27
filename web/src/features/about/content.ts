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
export type AboutContext = {
  baseUrl: string
  siteName: string
}

const CONTACT_EMAIL = '2082577455@qq.com'
const CONTACT_WECHAT = 'T_4417'

/**
 * Built-in About page, shown when no About content is configured in the admin
 * settings. Admin-provided content still takes precedence.
 */
export function buildAboutMarkdown(ctx: AboutContext): string {
  return `
# 关于 ${ctx.siteName}

${ctx.siteName} 是一个 AI API 中转网关。一个密钥、一个 Base URL，就能在几十种客户端里调用 Claude 和 GPT 系列模型，不用为每家厂商单独注册账号、单独充值、单独配置。

## 为什么做这个

用 AI 写代码的人多半都遇到过同一批麻烦事：

- 想比较几个模型，得分别去各家平台注册、绑卡、充值，其中一些还不支持国内的支付方式。
- 换个工具就要重新配一遍。Claude Code 说 Anthropic 协议，Codex 说 OpenAI 协议，同一个模型在不同工具里要配不同的东西。
- 钱花在哪不清楚。各家平台的用量统计口径不一样，想知道这个月到底在 AI 上花了多少，得一个个平台去翻。
- 余额分散。这边剩五美元，那边剩三美元，都不够用但又都取不出来。

${ctx.siteName} 把这些收拢到一处：**统一的协议入口、统一的余额、统一的用量账本。**

## 它是怎么工作的

网关同时支持三种主流的 API 协议格式，客户端用哪种就配哪个地址：

| 协议格式 | Base URL | 典型客户端 |
| --- | --- | --- |
| OpenAI 兼容 | \`${ctx.baseUrl}/v1\` | 绝大多数工具和 SDK |
| Anthropic 兼容 | \`${ctx.baseUrl}\` | Claude Code、Cline |
| Google Gemini | \`${ctx.baseUrl}/v1beta\` | Gemini SDK |

关键的一点：**协议格式和模型厂商是两件独立的事。** 你可以用 OpenAI 的官方 SDK 去请求 Claude 模型，网关在中间做协议转换。所以一个只支持「OpenAI 兼容」的老工具，照样能用上最新的 Claude。

目前接入的是 Claude 和 GPT 两个系列，具体型号和价格见[模型广场](/pricing)。上面表格里的 Gemini 协议入口是网关本身支持的格式，但我们暂时没有接入 Gemini 模型。

具体怎么配，见[使用文档](/docs)。

## 几件我们在意的事

**流式输出不打折。** 反向代理关掉了响应缓冲，token 是一个个吐出来的，不会攒成一批。这件事对聊天体验和编程工具的手感影响很大，但很容易被忽略。

**用量可核对。** 每一次请求都在[用量日志](/usage-logs)留一条记录，包含模型、输入/输出/缓存 token 的拆分、实际扣费。这是网关侧的真实计费数据，不是估算。怀疑某个工具在偷偷刷请求时，这里是唯一的事实来源。

**缓存照实计费。** 命中缓存的输入 token 按折扣价算，不按全价。这也是为什么我们在文档里专门写了一章[怎么少花钱](/docs/insights)——有些用法能省下很多，但反直觉。

**密钥可以分开管。** 可以按用途创建多个密钥，分别设额度上限、过期时间、可用模型范围和 IP 白名单。哪个泄露了单独删掉，不影响其他。

## 关于技术栈

${ctx.siteName} 基于开源项目 [new-api](https://github.com/QuantumNous/new-api) 构建，在其之上做了品牌定制和生产部署配置。核心能力来自上游：多协议适配、40 多个上游渠道的适配器、用量统计、计费管理、多用户与令牌管理。

我们对上游的改动主要在品牌资源、部署编排（Caddy 自动 HTTPS + PostgreSQL + Redis 的单机方案）和数据库备份脚本。上游的协议适配和计费逻辑没有修改。

按 [AGPL-3.0](https://github.com/QuantumNous/new-api/blob/main/LICENSE) 的要求，通过网络提供服务时必须向用户提供完整的对应源码——这也是我们把部署仓库公开的原因。

## 联系

有问题、有建议、发现 bug，或者想要某个还没上的模型，都欢迎找我们：

- **邮箱**：${CONTACT_EMAIL}
- **微信**：${CONTACT_WECHAT}

反馈问题时，如果能带上这些信息会快很多：用的什么客户端、完整的报错、大致的出错时间。**但请不要发送完整的 API 密钥**——需要的话只给前几位就够定位了。

`
}

export type AboutFaq = {
  question: string
  /** Markdown; rendered inside the collapsible panel. */
  answer: string
}

/** FAQ entries, rendered as an accordion rather than inline markdown. */
export function buildAboutFaqs(ctx: AboutContext): AboutFaq[] {
  return [
    {
      question: '会不会记录我的对话内容？',
      answer: `计费需要的元数据会记录（模型、token 数量、时间戳），这些就是你在[用量日志](/usage-logs)里看到的内容。`,
    },
    {
      question: '模型列表会更新吗？',
      answer: `会。新模型发布后我们会尽快接入。[模型广场](/pricing)是当前可用列表。

如果想在脚本里动态获取，用 \`GET ${ctx.baseUrl}/v1/models\`——它返回的是**你的密钥和分组下实际可用**的模型，比页面更贴合你的实际权限。`,
    },
    {
      question: '额度会过期吗？',
      answer: `充值的额度不设过期。

但你创建密钥时可以给单个密钥设过期时间和额度上限，那是密钥级别的限制，不影响账户余额。`,
    },
    {
      question: '支持哪些工具？',
      answer: `只要能改 Base URL 的都支持。文档里给了 Claude Code、Codex CLI、OpenCode、Cherry Studio、Cline、Roo Code、Continue、Zed、aider 等的具体配置步骤，见[使用文档](/docs)。

有一个例外：**Gemini CLI 接不了**，因为它只认 Google 原生协议，改 Base URL 也没用。不过这一点目前影响不大——我们暂时没有接入 Gemini 模型。`,
    },
    {
      question: '一个密钥可以在多个工具里同时用吗？',
      answer: `可以。密钥不限制并发来源，你可以在 Claude Code、编辑器插件和自己的脚本里用同一个。

不过建议按用途分开创建——这样在[用量日志](/usage-logs)里能直接看出是哪个工具在消耗，某一个泄露时也只需删掉那一个。`,
    },
    {
      question: '请求失败了怎么排查？',
      answer: `先用 curl 直连确认密钥和网关本身没问题，再检查客户端的 Base URL 有没有多写或少写 \`/v1\`。这两步能解决大部分情况。

完整的排查顺序和常见错误码见[常见问题](/docs/troubleshooting)。`,
    },
  ]
}
