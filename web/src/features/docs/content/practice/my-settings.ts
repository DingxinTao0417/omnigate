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

export const mySettings: DocChapter = {
  slug: 'my-settings',
  title: '我的 settings.json',
  summary: '权限白名单的取舍：放开什么、拦住什么、为什么。',
  keywords: ['settings.json', '权限', 'permissions', '配置', 'hooks', '实例'],
  build: (ctx) => `
# 我的 settings.json

${buildPracticeIntro({
  solves: '知道 permissions 怎么写，但不知道该放开到什么程度。',
  fits: '厌倦了每一步都点确认，又不想直接开 bypassPermissions 的人。',
  avoid:
    '团队共享仓库直接照抄 —— 我的白名单是按我自己的项目和风险承受度定的，命令名也不一样。',
})}

每个键的含义在[settings.json 全解](/docs/settings-json)那章，这里只讲我的取舍。

## 全局：\`~/.claude/settings.json\`

\`\`\`json
{
  "env": {
    "ANTHROPIC_BASE_URL": "${ctx.baseUrl}",
    "ANTHROPIC_AUTH_TOKEN": "sk-你的密钥",
    "ANTHROPIC_DEFAULT_HAIKU_MODEL": "claude-haiku-4-5",
    "CLAUDE_CODE_MAX_OUTPUT_TOKENS": "32000"
  },
  "model": "claude-sonnet-4-5",
  "permissions": {
    "defaultMode": "acceptEdits",
    "allow": [
      "Read(**)",
      "Bash(git status)",
      "Bash(git diff:*)",
      "Bash(git log:*)",
      "Bash(git branch)",
      "Bash(ls:*)",
      "Bash(rg:*)"
    ],
    "deny": [
      "Read(./.env)",
      "Read(./.env.*)",
      "Read(**/secrets/**)",
      "Read(**/id_rsa*)",
      "Bash(git push:*)",
      "Bash(git reset --hard:*)",
      "Bash(rm -rf:*)",
      "Bash(sudo:*)"
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

## 几个决定的理由

**\`defaultMode\` 用 \`acceptEdits\`。** 文件编辑自动通过，但跑命令仍然会问。这个组合是我试过之后最舒服的：改代码不打断思路，而真正有副作用的操作（装依赖、改数据库、推代码）还是会停下来。

用 \`default\` 太吵，每改一个文件都要确认，几轮之后你就开始条件反射地按 y——那时候确认已经失去意义了。

**全局 allow 只放只读命令。** \`git status\`、\`git diff\`、\`ls\`、\`rg\` 这些无论在哪个项目都安全。构建和测试命令我**不放在全局**，因为每个项目的命令不一样，放项目级配置里更准确。

**allow 规则要够窄。** 我不写 \`"Bash(git:*)"\`，虽然那样省事。因为它会把 \`git push --force\` 和 \`git reset --hard\` 一起放进来。宁可多写几行。

**deny 里那几条是不可逆操作。** 不是担心它故意搞破坏，而是它可能在理解偏差下执行了你没想要的操作，而这几类做完就回不去了。\`Read\` 那几条则是防止密钥进入上下文——一旦进去，就可能被写进它生成的代码或日志里。

注意 \`deny\` 在所有配置层级都合并生效，不会被项目级配置覆盖掉。这个设计是对的，禁止就该是禁止。

**\`includeCoAuthoredBy: false\`。** 纯个人偏好，我不想让 commit message 里出现署名行。想保留的话删掉这行就行。

## 项目级：\`.claude/settings.json\`

只放这个项目特有的命令，提交进 Git 给团队共用：

\`\`\`json
{
  "permissions": {
    "allow": [
      "Bash(bun run typecheck)",
      "Bash(bun run lint:*)",
      "Bash(bun run test:*)",
      "Bash(bun run format)",
      "Bash(go build ./...)",
      "Bash(go test ./...)"
    ]
  },
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

放开测试和类型检查是有意的：**只有它能自己跑验证，交回来的东西质量才有保证。** 拿不到失败输出的话，它给你的就是「我觉得应该能跑」。

那个 hook 是自动格式化。为什么用 hook 而不是在 \`CLAUDE.md\` 里写「记得格式化」：hook 是确定性的，一定执行；写在记忆文件里只是提示，可能被忽略。**凡是必须每次都发生的事，都该做成 hook。**

## 密钥放哪

上面全局配置里我为了展示写了 \`ANTHROPIC_AUTH_TOKEN\`。如果你的配置文件会进 Git，密钥必须挪到 \`.claude/settings.local.json\`——这个文件默认不进版本库。

我自己是放全局 \`~/.claude/settings.json\`，因为那个文件本来就不在任何仓库里。

## 一个我没开的东西

\`bypassPermissions\`（\`Shift+Tab\` 能切到）我日常不用。不是怕它删库——deny 规则拦着——而是那个确认停顿本身有价值：它是我发现「等等，这一步不对」的唯一机会。跳过之后，你只能在事后从 diff 里找问题。

只有两种情况我会开：一次性的沙箱容器里，或者我完全清楚接下来每一步要发生什么的批量操作。
`,
}
