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

export const statusline: DocChapter = {
  slug: 'statusline',
  title: '状态栏（ccline 等）',
  summary: '在终端底部常驻显示模型、分支、上下文占用和花费。',
  keywords: [
    'ccline',
    'CCometixLine',
    'statusline',
    '状态栏',
    'ccusage',
    'ccstatusline',
    'nerd font',
  ],
  build: () => `
# 状态栏

Claude Code 的终端底部可以常驻一行信息：当前模型、目录、Git 分支、上下文用了多少、这一轮花了多少钱。装完之后你会发现很难回去——**上下文占用百分比是最有价值的那个数字**，它直接告诉你什么时候该 \`/compact\`。

## 原理

\`settings.json\` 里配一个命令，Claude Code 每次刷新时执行它，并把当前会话状态以 JSON 从 stdin 喂进去。命令打印什么，状态栏就显示什么。

\`\`\`json
{
  "statusLine": {
    "type": "command",
    "command": "你的命令",
    "padding": 0
  }
}
\`\`\`

stdin 里能拿到的字段包括 \`model.display_name\`、\`cwd\`、\`cost.total_cost_usd\`、\`context_window.used_percentage\`、\`session_id\`，以及 Git 分支和 worktree 信息。也就是说你完全可以自己写个几十行的脚本搞定，但现成的更省事。

## 方案一：ccline（推荐）

[Haleclipse/CCometixLine](https://github.com/Haleclipse/CCometixLine)，Rust 写的，启动快，有交互式配置界面。

\`\`\`bash
npm install -g @cometix/ccline
\`\`\`

然后在 \`~/.claude/settings.json\` 里：

\`\`\`json
{
  "statusLine": {
    "type": "command",
    "command": "~/.claude/ccline/ccline",
    "padding": 0
  }
}
\`\`\`

Windows 也用这个波浪号形式的路径（较新版本的 Claude Code 支持），不要写 \`%USERPROFILE%\`。

配置命令：

\`\`\`bash
ccline --config          # 打开交互式 TUI 配置
ccline --theme gruvbox   # 换主题
ccline --init            # 初始化配置文件
\`\`\`

自带主题有 cometix、minimal、gruvbox、nord、powerline-dark，自定义主题放 \`~/.claude/ccline/themes/\`。

**前提：得装 Nerd Font**，不然图标全是方块。去 [nerdfonts.com](https://www.nerdfonts.com/) 挑一个（JetBrainsMono Nerd Font 是个稳妥选择），装好后在终端设置里把字体切过去。

## 方案二：ccusage

[ryoppippi/ccusage](https://github.com/ryoppippi/ccusage) 主要是用量分析工具，顺带有状态栏模式。免安装：

\`\`\`json
{
  "statusLine": {
    "type": "command",
    "command": "npx ccusage@latest statusline"
  }
}
\`\`\`

它读 Claude Code 的会话记录文件来算用量。好处是不用装东西，坏处是每次刷新都走 \`npx\`，比原生二进制慢。

## 方案三：ccstatusline

[sirmalloc/ccstatusline](https://github.com/sirmalloc/ccstatusline)，powerline 风格，配置项很细。

\`\`\`json
{
  "statusLine": {
    "type": "command",
    "command": "npx -y ccstatusline@latest",
    "padding": 0,
    "refreshInterval": 10
  }
}
\`\`\`

\`refreshInterval\` 需要较新版本的 Claude Code 才认。首次运行 \`npx -y ccstatusline@latest\` 会进 TUI，里面可以选「pinned global install」装成本地二进制，避免每次走 npx。

## 自己写一个

不想装任何东西的话，二十行 shell 就够：

\`\`\`bash
#!/usr/bin/env bash
input=$(cat)
model=$(echo "$input" | jq -r '.model.display_name')
pct=$(echo "$input" | jq -r '.context_window.used_percentage // 0')
cost=$(echo "$input" | jq -r '.cost.total_cost_usd // 0')
branch=$(git branch --show-current 2>/dev/null)

printf '%s | ctx %.0f%% | $%.3f' "$model" "$pct" "$cost"
[ -n "$branch" ] && printf ' | %s' "$branch"
\`\`\`

存成 \`~/.claude/statusline.sh\`，\`chmod +x\`，然后 \`"command": "~/.claude/statusline.sh"\`。需要 \`jq\`。

## 用量监控

想看更长时间维度的花费，[Maciek-roboblog/Claude-Code-Usage-Monitor](https://github.com/Maciek-roboblog/Claude-Code-Usage-Monitor) 是个独立 TUI：

\`\`\`bash
uv tool install claude-monitor
claude-monitor
\`\`\`

它按 5 小时滚动窗口统计 token、消息数、燃烧速率和预测。不过说实话，接了本站之后，[用量日志](/usage-logs)页面的数据更准——那是网关侧的真实计费记录，而这些工具是从本地会话文件估算的。
`,
}
