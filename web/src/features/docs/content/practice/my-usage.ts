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

export const myUsage: DocChapter = {
  slug: 'my-usage',
  title: '我的用法',
  summary:
    '双模型流水线：Codex 只挑刺，Claude 帮决策，循环到审查通过。',
  keywords: [
    '用法',
    'workflow',
    'codex',
    'gpt',
    'claude',
    'opus',
    'code review',
    '审查',
    '挑刺',
    '双模型',
    'prompt',
  ],
  build: () => `
# 我的用法

${buildPracticeIntro({
  solves:
    '写完代码或方案后，不知道该怎么系统性找 bug；或者问题太多、看不懂时，不知道该修不该修、修到什么程度。',
  fits: '已经会用 Claude / Codex 写代码，想把「生成 → 审查 → 决策 → 再修」固定成一套可重复流程的人。',
  avoid:
    '还在配 Base URL 的阶段 —— 先去[快速开始](/docs/introduction)和[安装工具](/docs/claude-code)。提示词可以照抄，但模型档位按你账户可用列表来，名称会变。',
})}

核心想法很简单：**写代码和挑刺不要用同一种姿势。**  
生成时用 Claude 系（上下文长、听话）；验收时用 Codex / GPT 系当「只找茬的审查员」；问题多或看不懂时，再把问题翻译成白话 + 大厂尺度的决策参考，**最后拍板的是你**。

模型名会变，下面用角色称呼：

| 阶段 | 角色 | 我常用的档位（示意） |
| --- | --- | --- |
| 写代码 / 改方案 | Claude 执行者 | 满血 Sonnet 档 / 稳定 Opus 档（高 effort） |
| 严格挑刺 | Codex 审查员 | GPT-5 系 + high / sol 一类推理档 |
| 业务决策辅助 | Claude 导演 | 同上，偏能讲清楚利弊的档 |

具体模型 ID 以[模型广场](/pricing)为准，复制粘贴即可。

---

## 总流程（一张图看完）

![双模型流水线：Claude 写代码 → Codex 严格审查 → 可选 Claude 决策辅助 → 修复后再审查](/docs/ai-usage-workflow.jpg)

---

## 第一阶段：严格代码审查（Codex / GPT 角色）

**什么时候用：** 代码或计划写完，立刻跑。不要「先合并再说」。

**核心约束：只挑刺，不润色。**  
禁止建议重构、重命名、风格调整、补注释、顺手优化——那些会把审查稀释成闲聊。

### 角色设定（可直接整段粘贴）

\`\`\`text
你是一名资深安全架构师，正在审查另一个 AI 助手编写的计划/代码。
你的任务是独立验证其正确性。

只回答下面 4 点。严禁建议重构、重命名、风格调整或添加注释。

审查清单：
1. 逻辑是否正确？（业务流程是否跑得通）
2. 是否遗漏边界情况？（空值、并发、超时、极限数据）
3. 是否存在安全隐患？（注入、越权、敏感信息泄露、资源耗尽）
4. 是否符合既定需求？（对照原始需求，有无功能偏离）

输出要求：
- 只报告「确定的」Bug、逻辑错误和安全隐患
- 不确定的标成「存疑」并说明缺什么信息，不要装作肯定
- 一轮回答内给完整清单，按严重程度排序
- 每条问题写清：位置（文件/函数/步骤）、现象、为何是错的
\`\`\`

### 怎么执行

1. 把本轮改动（diff / 关键文件 / 方案段落）和**原始需求**一起丢给 Codex。  
2. 先贴上面的角色设定，再问，例如：

\`\`\`text
/goal 本轮对话的改动还有啥问题吗
\`\`\`

3. 拿到问题清单后，不要急着自己改完。可以继续：

\`\`\`text
/goal 处理掉发现的问题
\`\`\`

让它按清单逐条修；修完再跑一轮第一阶段，直到清单为空或只剩你明确接受的「存疑」。

### 这一阶段刻意不要做什么

- 不要让它「顺便重构得更优雅」  
- 不要和它辩论风格  
- 不要一次塞三个不相关的 PR  

**挑刺阶段越窄，越像真人 code review。**

---

## 第二阶段：业务决策辅助（Claude / Opus 角色）

**什么时候用：**

- 第一阶段一次甩出很多问题，你分不清优先级；或  
- 逻辑太绕，Codex 的结论你看不懂；或  
- 修与不修、怎么修，需要业务判断而不是再写一行 if。

**核心约束：解释影响 + 给大厂尺度的参考，裁决权在你。**

### 角色设定（可直接整段粘贴）

\`\`\`text
你是一名大厂技术总监，正在审阅技术方案与审查意见。

交互要求：
1. 如果我没看懂，请先用最简单的非技术语言（外行也能懂）解释核心逻辑，再展开细节。
2. 结合具体业务场景说明每个问题会造成什么实际影响
   （例如：数据对不上、接口不可用、账算错、权限被绕过、资源被打爆）。
3. 终极决策参考：若同样问题出现在一线大厂（阿里 / 腾讯 / 字节等）的生产环境，
   他们更可能怎么处理？例如：
   - 直接拒绝合并
   - 必须改方案再合
   - 先合但加监控 / 限流 / 开关
   - 紧急 Hotfix
   - 可记债务、排期再修
4. 给出不同方案的利弊对照，由我做最终裁决。不要替我选「最优雅」的那一个。
\`\`\`

### 怎么执行

把这些一起给 Claude：

- 相关代码或方案片段  
- Codex 输出的**问题清单**（原样粘贴最好）  
- 你的业务背景（谁在用、钱/数据/权限有多敏感）

然后按你的节奏追问：「第 3 条如果先上线会怎样？」「按大厂标准必须挡合并吗？」

---

## 组合使用：我的实操顺序

1. **写 / 改** —— 用 Claude（满血或稳定高 effort 档）生成代码或方案。  
2. **马上挑刺** —— 同一批改动丢给 Codex（GPT-5 系 high 推理档），套**第一阶段**提示词。  
3. **看不懂或问题严重** —— 把 Codex 的清单 + 代码发给 Claude，套**第二阶段**提示词，要白话影响 + 大厂尺度处理方式。  
4. **你拍板** —— 哪些必须修、哪些可延后、哪些是误报。  
5. **执行修复** —— 回到 Codex：\`/goal 处理掉（你确认要修的）问题\`。  
6. **再审查** —— 重复 2～5，直到第一阶段没有「必须修」的项。

经验上：

- 小改动：常常 1～2 轮第一阶段就够，不一定上第二阶段。  
- 计费、鉴权、多租户、并发：建议强制过第一阶段，存疑项尽量走第二阶段再决定。  
- 两个模型用**不同密钥 / 不同会话**也行，重点是角色不要混——不要让刚写完代码的同一个会话既当作者又当严苛审查员。

---

## 和本站文档其它篇的关系

- 省钱、上下文、\`/clear\` vs \`/compact\`：见[AI 使用心得](/docs/insights)  
- 项目级约束怎么写：见[我的 CLAUDE.md](/docs/my-claude-md)  
- Claude Code 开关与权限：见[我的 settings.json](/docs/my-settings)  
- 工具怎么接到本站：见[安装 Claude Code](/docs/claude-code)、[安装 Codex CLI](/docs/codex)

这套流程不依赖某一家的 UI，换客户端只要还支持「粘贴提示词 + 贴代码」就能用。
`,
}
