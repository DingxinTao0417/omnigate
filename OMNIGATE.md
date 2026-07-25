# Omnigate

统一的 AI API 中转网关，一个接口访问 Claude、GPT、Grok、Kimi、DeepSeek、GLM、
MiniMax 等主流大模型。

站点：<https://omnigate.cc>

## 这是什么

Omnigate 基于开源项目 [new-api](https://github.com/QuantumNous/new-api) 构建，
在其之上做了品牌定制与生产部署配置。核心能力来自上游：多协议适配、用量统计、
计费管理、多用户与令牌管理。

客户端只需把 Base URL 换成 `https://omnigate.cc`，用系统分配的令牌作为 API
Key，即可在任意兼容 OpenAI 格式的工具中调用各家模型，无需为每个平台单独配置。

## 部署

本仓库包含一套可直接使用的单机生产部署配置：

| 文件 | 用途 |
| --- | --- |
| `docker-compose.prod.yml` | 从源码构建 + Caddy 自动 HTTPS + PostgreSQL + Redis |
| `Caddyfile` | 反向代理，关闭响应缓冲以保证流式输出不被攒批 |
| `.env.prod.example` | 密钥模板 |
| `bin/backup-db.sh` | 数据库备份，带保留期清理 |
| `docs/installation/VPS.md` | 部署指南（讲原理与取舍） |
| `docs/installation/deploy-log.md` | 实际部署命令流水与踩过的坑 |

仓库里的 `docker-compose.yml` 是上游原文件，其 `image` 指向上游镜像，**不包含
本仓库的改动**，仅为便于日后合并上游更新而保留。部署请用
`docker-compose.prod.yml`。

快速开始见 [docs/installation/VPS.md](./docs/installation/VPS.md)。

## 与上游的差异

- 品牌资源替换为 Omnigate（透明背景标识、favicon、apple-touch-icon、桌面端图标），
  设计源文件与派生说明见 [docs/brand/](./docs/brand/)
- 前端品牌兜底改为统一引用 `DEFAULT_SYSTEM_NAME` / `DEFAULT_LOGO`，
  取代原先三处各自硬编码的字面量
- 后端默认 `SystemName`、页面 title / meta、Electron 窗口标题
- 新增上述生产部署配置与备份脚本

上游的功能代码、协议适配、计费逻辑未作修改。

## 联系

- 邮箱：2082577455@qq.com
- 微信：T_4417

## 许可

本项目继承上游的 [AGPL-3.0](./LICENSE) 许可。AGPL-3.0 要求：通过网络向用户提供
服务时，必须向这些用户提供完整的对应源码 —— 这也是本仓库公开的原因。

上游版权声明、`NOTICE` 与各文件许可头均已保留。如需商业授权，请按 `LICENSE`
中的说明联系上游作者。
