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

export const prerequisites: DocChapter = {
  slug: 'prerequisites',
  title: '环境准备',
  summary: 'Node.js、包管理器、终端与环境变量的持久化。',
  keywords: [
    'node',
    'nodejs',
    'npm',
    'bun',
    'winget',
    'homebrew',
    '环境变量',
    'env',
  ],
  build: () => `
# 环境准备

大部分 AI 编程 CLI 是 Node 写的，装它们之前先把 Node 和终端理顺。已经有 Node 20+ 的可以跳过这一章。

## 装 Node.js

**Windows**（PowerShell）：

\`\`\`powershell
winget install OpenJS.NodeJS.LTS
\`\`\`

**macOS**：

\`\`\`bash
brew install node
\`\`\`

没装 Homebrew 的先来一句：

\`\`\`bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
\`\`\`

**Linux**（Debian/Ubuntu，走 NodeSource 拿到新版本，发行版自带的往往太旧）：

\`\`\`bash
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt-get install -y nodejs
\`\`\`

**推荐做法：用版本管理器。** 不同项目要不同 Node 版本时会省掉很多麻烦，而且不需要 \`sudo\` 就能全局装 npm 包（这一点很重要，用 sudo 装的全局包经常出权限问题）：

\`\`\`bash
# fnm，快，跨平台
curl -fsSL https://fnm.vercel.app/install | bash
fnm install --lts

# 或者 nvm，老牌
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.1/install.sh | bash
nvm install --lts
\`\`\`

装完验证：

\`\`\`bash
node -v
npm -v
\`\`\`

## 持久化环境变量

后面几乎每个工具都要靠环境变量指定 Base URL 和密钥。临时 \`export\` 关掉终端就没了，要写进配置文件。

**macOS / Linux。** 先确认你用的是哪个 shell（\`echo $SHELL\`），macOS 默认是 zsh，多数 Linux 是 bash。往对应文件末尾追加：

\`\`\`bash
# zsh
echo 'export ANTHROPIC_BASE_URL="https://example.com"' >> ~/.zshrc
source ~/.zshrc

# bash
echo 'export ANTHROPIC_BASE_URL="https://example.com"' >> ~/.bashrc
source ~/.bashrc
\`\`\`

**Windows PowerShell。** 三种作用域，别搞混：

\`\`\`powershell
# 只对当前窗口有效，关了就没
$env:ANTHROPIC_BASE_URL = "https://example.com"

# 写进用户级注册表，对之后新开的所有进程有效（当前窗口不受影响）
setx ANTHROPIC_BASE_URL "https://example.com"

# 写进 PowerShell 配置文件，每次开 PowerShell 自动加载
notepad $PROFILE
\`\`\`

\`$PROFILE\` 文件不存在时 notepad 会问你要不要新建，选是。在里面加 \`$env:XXX = "..."\` 那样的行。

一个容易踩的坑：\`setx\` 之后当前窗口读不到新值，必须新开一个终端。

## 关于 WSL

Windows 上如果你更习惯 Linux 环境，装 WSL2 会让很多工具的体验顺畅不少（尤其是涉及 shell 脚本和 Unix 路径的场景）：

\`\`\`powershell
wsl --install
\`\`\`

不过现在 Claude Code 和 Codex 都有原生 Windows 支持了，不用 WSL 也能跑。选哪个看你的项目在哪——**代码放在哪个文件系统，就在哪一侧运行工具**。跨 \`/mnt/c\` 访问 Windows 文件系统的 I/O 很慢，大项目上差别明显。

## 密钥别写进代码

密钥放环境变量或工具自己的配置文件，不要提交到 Git。给项目加 \`.env\` 的话，记得同时在 \`.gitignore\` 里排除它。Claude Code 还可以在 \`settings.json\` 里用 \`permissions.deny\` 明确禁止自己读 \`.env\`，做法见[Claude Code 进阶](/docs/claude-code-advanced)。
`,
}

export const claudeCode: DocChapter = {
  slug: 'claude-code',
  title: '安装 Claude Code',
  summary: 'Windows / macOS / Linux 全平台安装，并接到本站。',
  keywords: [
    'claude code',
    'claude',
    'anthropic',
    'install',
    '安装',
    'ANTHROPIC_BASE_URL',
    'ANTHROPIC_AUTH_TOKEN',
  ],
  build: (ctx) => `
# 安装 Claude Code

Claude Code 是 Anthropic 官方的终端编程 agent，也是目前和本站配合最紧密的工具。它说 Anthropic Messages 协议，通过两个环境变量就能整体切到本站。

## 安装

**macOS / Linux / WSL：**

\`\`\`bash
curl -fsSL https://claude.ai/install.sh | bash
\`\`\`

**Windows PowerShell：**

\`\`\`powershell
irm https://claude.ai/install.ps1 | iex
\`\`\`

**Windows CMD：**

\`\`\`bat
curl -fsSL https://claude.ai/install.cmd -o install.cmd && install.cmd && del install.cmd
\`\`\`

**Homebrew（macOS/Linux）：**

\`\`\`bash
brew install --cask claude-code
\`\`\`

**WinGet（Windows）：**

\`\`\`powershell
winget install Anthropic.ClaudeCode
\`\`\`

装完验证：

\`\`\`bash
claude --version
claude doctor
\`\`\`

\`claude doctor\` 会体检安装状态、版本、配置文件位置和权限，出问题时第一个该跑的就是它。

原生安装脚本装出来的版本会自动后台更新；Homebrew 和 WinGet 装的不会，需要你自己 \`brew upgrade\` 或 \`winget upgrade\`。

## 接到本站

Claude Code 认这几个环境变量：

| 变量 | 作用 |
| --- | --- |
| \`ANTHROPIC_BASE_URL\` | 网关地址，**不带** \`/v1\` |
| \`ANTHROPIC_AUTH_TOKEN\` | 你的密钥，以 \`Authorization: Bearer\` 发送 |
| \`ANTHROPIC_MODEL\` | 默认主模型 |
| \`ANTHROPIC_DEFAULT_HAIKU_MODEL\` | 小模型（用于摘要、标题等杂活） |

**macOS / Linux：**

\`\`\`bash
cat >> ~/.zshrc <<'EOF'
export ANTHROPIC_BASE_URL="${ctx.baseUrl}"
export ANTHROPIC_AUTH_TOKEN="sk-你的密钥"
export ANTHROPIC_MODEL="claude-sonnet-4-5"
export ANTHROPIC_DEFAULT_HAIKU_MODEL="claude-haiku-4-5"
EOF
source ~/.zshrc
\`\`\`

**Windows PowerShell：**

\`\`\`powershell
setx ANTHROPIC_BASE_URL "${ctx.baseUrl}"
setx ANTHROPIC_AUTH_TOKEN "sk-你的密钥"
setx ANTHROPIC_MODEL "claude-sonnet-4-5"
setx ANTHROPIC_DEFAULT_HAIKU_MODEL "claude-haiku-4-5"
\`\`\`

然后**新开一个终端**，进入你的项目目录，直接：

\`\`\`bash
claude
\`\`\`

## AUTH_TOKEN 还是 API_KEY

两个都能用，区别在请求头：

- \`ANTHROPIC_AUTH_TOKEN\` → \`Authorization: Bearer sk-xxx\`
- \`ANTHROPIC_API_KEY\` → \`x-api-key: sk-xxx\`

本站两种都接受。**推荐用 \`ANTHROPIC_AUTH_TOKEN\`**，因为设了 \`ANTHROPIC_API_KEY\` 时 Claude Code 会在首次启动时弹一次确认（它以为你要覆盖官方订阅），而 \`AUTH_TOKEN\` 不会。

两个都别同时设，行为会变得难以预测。

## 不想污染全局环境变量

如果你同时在用官方订阅和本站，把变量写死在全局会互相干扰。三个办法：

**办法一，项目级 settings.json。** 在项目里建 \`.claude/settings.json\`：

\`\`\`json
{
  "env": {
    "ANTHROPIC_BASE_URL": "${ctx.baseUrl}",
    "ANTHROPIC_AUTH_TOKEN": "sk-你的密钥",
    "ANTHROPIC_MODEL": "claude-sonnet-4-5"
  }
}
\`\`\`

这份文件会随项目走。如果项目要提交到 Git，把密钥那行挪到 \`.claude/settings.local.json\`（这个文件默认不进版本库）。

**办法二，写个别名。** 只在需要时切过去：

\`\`\`bash
alias cco='ANTHROPIC_BASE_URL="${ctx.baseUrl}" ANTHROPIC_AUTH_TOKEN="sk-你的密钥" claude'
\`\`\`

之后 \`cco\` 走本站，\`claude\` 走官方。

**办法三，用 CC Switch。** 图形界面管理多套配置，一键切换，见[桌面与 GUI 客户端](/docs/gui-clients)。

## 第一次用

进到项目目录敲 \`claude\`，然后：

\`\`\`text
/init
\`\`\`

它会扫一遍项目结构，生成一份 \`CLAUDE.md\` 作为长期记忆。这份文件的写法直接决定后续所有对话的质量，值得认真对待——详见[CLAUDE.md 怎么写](/docs/claude-md)。

几个一开始就该知道的命令：

| 命令 | 作用 |
| --- | --- |
| \`/model\` | 切模型 |
| \`/context\` | 看当前上下文占用了多少，什么占的 |
| \`/clear\` | 清空对话（省钱但要慎用，见[AI 使用心得](/docs/insights)） |
| \`/compact\` | 压缩历史，保留要点 |
| \`/cost\` | 看这一轮花了多少 |
| \`/doctor\` | 体检 |
| \`/rewind\` | 回滚到之前的检查点 |
| \`Shift+Tab\` | 循环切换权限模式（含计划模式） |

## 常用环境变量

除了接入用的那几个，这些在第三方网关下也值得设：

\`\`\`bash
# 单次响应的最大输出 token
export CLAUDE_CODE_MAX_OUTPUT_TOKENS=32000

# 扩展思考的预算
export MAX_THINKING_TOKENS=16000

# 请求超时，默认 600000（10 分钟）
export API_TIMEOUT_MS=600000

# 关掉遥测、错误上报和非必要流量
export CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC=1
\`\`\`

最后那一条会顺带关掉自动更新，设了它之后记得偶尔手动 \`claude update\`。
`,
}
