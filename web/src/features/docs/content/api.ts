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

export const apiReference: DocChapter = {
  slug: 'api',
  title: 'API 调用与 SDK',
  summary: 'curl、Python、Node、Go 的接入代码，含流式与工具调用。',
  keywords: [
    'api',
    'sdk',
    'python',
    'node',
    'openai',
    'anthropic',
    'curl',
    'stream',
  ],
  build: (ctx) => `
# API 调用与 SDK

所有官方 SDK 都支持改 Base URL，所以接本站不需要换库、不需要改业务代码，改两行配置就行。

## OpenAI 兼容

**Python：**

\`\`\`python
from openai import OpenAI

client = OpenAI(
    base_url="${ctx.baseUrl}/v1",
    api_key="sk-你的密钥",
)

resp = client.chat.completions.create(
    model="claude-sonnet-4-5",
    messages=[{"role": "user", "content": "用一句话解释 CAP 定理"}],
)
print(resp.choices[0].message.content)
\`\`\`

注意这里：用的是 OpenAI 的库，但请求的是 Claude 模型。协议和厂商是两件事，网关在中间做转换。

**Node / TypeScript：**

\`\`\`ts
import OpenAI from 'openai'

const client = new OpenAI({
  baseURL: '${ctx.baseUrl}/v1',
  apiKey: process.env.OMNIGATE_API_KEY,
})

const resp = await client.chat.completions.create({
  model: 'claude-sonnet-4-5',
  messages: [{ role: 'user', content: '用一句话解释 CAP 定理' }],
})

console.log(resp.choices[0].message.content)
\`\`\`

**Go：**

\`\`\`go
package main

import (
	"context"
	"fmt"

	"github.com/openai/openai-go"
	"github.com/openai/openai-go/option"
)

func main() {
	client := openai.NewClient(
		option.WithBaseURL("${ctx.baseUrl}/v1"),
		option.WithAPIKey("sk-你的密钥"),
	)

	resp, err := client.Chat.Completions.New(context.Background(),
		openai.ChatCompletionNewParams{
			Model: "claude-sonnet-4-5",
			Messages: []openai.ChatCompletionMessageParamUnion{
				openai.UserMessage("用一句话解释 CAP 定理"),
			},
		})
	if err != nil {
		panic(err)
	}
	fmt.Println(resp.Choices[0].Message.Content)
}
\`\`\`

## Anthropic 兼容

Base URL **不带** \`/v1\`，SDK 自己会补：

\`\`\`python
from anthropic import Anthropic

client = Anthropic(
    base_url="${ctx.baseUrl}",
    auth_token="sk-你的密钥",
)

msg = client.messages.create(
    model="claude-sonnet-4-5",
    max_tokens=1024,
    messages=[{"role": "user", "content": "用一句话解释 CAP 定理"}],
)
print(msg.content[0].text)
\`\`\`

用 \`auth_token\` 而不是 \`api_key\`，对应 \`Authorization: Bearer\` 头。两种本站都收，但混着设容易出问题。

## 流式输出

\`\`\`python
stream = client.chat.completions.create(
    model="claude-sonnet-4-5",
    messages=[{"role": "user", "content": "写一首关于并发的短诗"}],
    stream=True,
)

for chunk in stream:
    delta = chunk.choices[0].delta.content
    if delta:
        print(delta, end="", flush=True)
\`\`\`

要拿到流式响应里的 token 统计，加上 \`stream_options\`：

\`\`\`python
stream = client.chat.completions.create(
    model="claude-sonnet-4-5",
    messages=[...],
    stream=True,
    stream_options={"include_usage": True},
)
\`\`\`

最后一个 chunk 会带 \`usage\`。不是所有上游都支持这个参数，不支持时按[用量日志](/usage-logs)里的记录为准。

## 工具调用

\`\`\`python
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "查询指定城市的天气",
        "parameters": {
            "type": "object",
            "properties": {
                "city": {"type": "string", "description": "城市名"},
            },
            "required": ["city"],
        },
    },
}]

resp = client.chat.completions.create(
    model="claude-sonnet-4-5",
    messages=[{"role": "user", "content": "北京今天天气怎么样"}],
    tools=tools,
)

print(resp.choices[0].message.tool_calls)
\`\`\`

## 列出可用模型

\`\`\`bash
curl ${ctx.baseUrl}/v1/models \\
  -H "Authorization: Bearer sk-你的密钥"
\`\`\`

返回的是**你当前密钥和分组下实际可用**的模型，比[模型广场](/pricing)页面更贴合你的实际权限。写自动化脚本时用这个接口而不是硬编码列表。

## 其他端点

网关还支持这些，路径和 OpenAI 官方一致：

| 端点 | 用途 |
| --- | --- |
| \`/v1/responses\` | OpenAI Responses 协议 |
| \`/v1/embeddings\` | 向量嵌入 |
| \`/v1/images/generations\` | 文生图 |
| \`/v1/images/edits\` | 图片编辑 |
| \`/v1/audio/transcriptions\` | 语音转文字 |
| \`/v1/audio/speech\` | 文字转语音 |
| \`/v1/rerank\` | 重排序 |
| \`/v1/moderations\` | 内容审核 |
| \`/v1beta/models/*\` | Gemini 原生协议 |

## 出错时

错误返回标准 HTTP 状态码和 JSON body。几个常见的：

| 状态码 | 原因 | 怎么办 |
| --- | --- | --- |
| 401 | 密钥无效或格式错 | 检查 \`Authorization: Bearer sk-...\` |
| 402 | 额度不足 | 去[钱包](/wallet)充值 |
| 404 | 模型名不存在 | 用 \`/v1/models\` 核对拼写 |
| 429 | 触发限流 | 退避重试 |
| 5xx | 上游异常 | 重试；持续失败请反馈 |

生产代码建议对 429 和 5xx 做指数退避重试，对 4xx 不要重试（重试也不会变对）。
`,
}
