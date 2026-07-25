# Omnigate VPS 部署

面向单机 VPS + Cloudflare 托管域名的生产部署。本文的目标形态：

```
用户 ──HTTPS──> VPS:443 (Caddy) ──> omnigate:3000 ──> postgres + redis
```

使用 `docker-compose.prod.yml` 而非仓库里的 `docker-compose.yml`。后者的
`image` 指向上游 `calciumion/new-api:latest`，跑起来是原版 new-api，本地的
Omnigate 改动不会生效；前者用 `build: .` 从源码构建。

## 环境要求

| 项 | 要求 | 说明 |
| --- | --- | --- |
| 系统 | Ubuntu 22.04 / 24.04 | 20.04 已 EOL，不再收安全更新 |
| 虚拟化 | KVM | OpenVZ 共享内核，Docker 会有问题 |
| 内存 | ≥ 2 GB | 构建期 bun + Go 编译是峰值，运行期约 700 MB |
| 磁盘 | ≥ 20 GB | 构建缓存数 GB，日志和数据库长期增长 |
| 架构 | x86_64 或 arm64 | 不支持 32 位 |

内存不足 2 GB 时不要在服务器上构建，改为本地 `docker build` 后推送到
registry，服务器只拉取运行。

## 1. DNS

在 Cloudflare 给 `omnigate.cc` 加一条 A 记录指向 VPS 的 IP，代理状态设为
**仅 DNS（灰云）**。

灰云是刻意的选择，不是省事：Cloudflare 免费版代理对单个请求有 100 秒上限，
而大模型的长回答流式输出经常超过这个时间，走橙云会被中途切断。代价是 VPS 真实
IP 暴露、没有 CF 的 DDoS 防护，用第 2 步的防火墙和 fail2ban 缓解。

继续之前先确认解析已生效，否则第 5 步 Caddy 申请证书会失败：

```bash
dig +short omnigate.cc
```

## 2. 系统准备

```bash
# 全部以 root 执行；非 root 用户在每条命令前加 sudo
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg git ufw fail2ban

# Docker 官方源（Ubuntu 仓库里的 docker.io 版本偏旧）
install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
  | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
chmod a+r /etc/apt/keyrings/docker.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo $VERSION_CODENAME) stable" \
  > /etc/apt/sources.list.d/docker.list
apt update
apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin

docker --version && docker compose version
```

防火墙。只放 SSH 和 HTTP(S)，数据库和 Redis 不对外暴露（compose 里它们没有
`ports:`，只在内部网络可达）：

```bash
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp   # HTTP/3
ufw --force enable
ufw status
```

`fail2ban` 装上即可，Ubuntu 默认启用 sshd 规则，会自动封禁暴力破解 IP。

> SSH 端口若不是 22，先 `ufw allow <端口>/tcp` 再 enable，否则会把自己关在门外。

## 3. 拉取代码

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/DingxinTao0417/omnigate.git
cd omnigate
```

仓库是 private，会要求认证。用 GitHub Personal Access Token（Settings →
Developer settings → Tokens，勾 `repo` 权限）作为密码，或在服务器上装 `gh`
后 `gh auth login`。

## 4. 配置密钥

```bash
cp .env.prod.example .env
```

生成四个密钥并填进 `.env`：

```bash
for k in POSTGRES_PASSWORD REDIS_PASSWORD SESSION_SECRET CRYPTO_SECRET; do
  echo "$k=$(openssl rand -hex 32)"
done
```

再把 `ACME_EMAIL` 改成你的真实邮箱（Let's Encrypt 用它发证书过期提醒），
`DOMAIN` 确认是 `omnigate.cc`。

```bash
chmod 600 .env
```

几个值的含义，改动前要知道后果：

- `SESSION_SECRET` — 签名鉴权 token。改了之后所有用户的登录态立即失效。
- `CRYPTO_SECRET` — 缓存键的 HMAC 密钥。不设时默认跟随 `SESSION_SECRET`。
- `POSTGRES_PASSWORD` — 首次启动时写入数据库。之后再改 `.env` 不会同步修改
  数据库里已有的密码，会导致连不上；真要改得进容器 `ALTER USER`。

## 5. 启动

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

首次构建要跑 bun 打前端 + Go 编译，2 GB 内存的机器大约 5-10 分钟。构建卡在
前端阶段且容器被 kill，基本是内存不够，加 swap：

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile
mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
```

看状态和日志：

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f omnigate
docker compose -f docker-compose.prod.yml logs caddy | grep -i certificate
```

四个容器都应是 `running`，`omnigate` 与两个数据库还会显示 `healthy`。Caddy
的证书申请通常几秒完成，日志里会有 `certificate obtained successfully`。

## 6. 初始化

浏览器打开 `https://omnigate.cc`，首次访问会进初始化向导，创建管理员账号。

**创建后立刻做两件事**：把默认的 `root` 账号密码改成强密码；到「系统设置 →
登录注册」关掉不需要的注册方式。这个服务对公网开放，默认允许自助注册的话会有
人来白嫖额度。

品牌信息虽然代码里默认值已是 Omnigate，但运行时配置优先级更高，可在「系统设置
→ 站点设置」调整站点名、页脚、公告、关于页。Logo 留空即走内置的
`/logo.png`。

## 7. 日常运维

```bash
cd /opt/omnigate

# 更新代码后重新构建
git pull && docker compose -f docker-compose.prod.yml up -d --build

# 重启单个服务
docker compose -f docker-compose.prod.yml restart omnigate

# 停止（数据保留在 volume 里）
docker compose -f docker-compose.prod.yml down
```

数据库备份。`pg_data` 是 Docker volume，删掉容器不会丢，但删 volume 或机器
故障就没了，定期导出：

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U omnigate omnigate | gzip > ~/omnigate-$(date +%F).sql.gz
```

恢复：

```bash
gunzip -c omnigate-2026-01-01.sql.gz | docker compose -f docker-compose.prod.yml \
  exec -T postgres psql -U omnigate -d omnigate
```

## 排查

**证书申请失败** — 检查 DNS 是否已生效、Cloudflare 是否确实是灰云（橙云会让
Let's Encrypt 的 HTTP-01 校验拿到 CF 的 IP 而非你的 VPS）、80 端口是否放行。

**流式响应一卡一卡的** — Caddyfile 里的 `flush_interval -1` 是关掉响应缓冲的
关键，改动过要确认它还在。

**登录后立刻掉线** — `SESSION_COOKIE_SECURE=true` 时 `SESSION_COOKIE_TRUSTED_URL`
必须精确匹配浏览器地址栏的 origin（含协议、无尾斜杠）。它是从 `.env` 的
`DOMAIN` 拼出来的，确认 `DOMAIN` 没写成 `https://omnigate.cc` 或带 `www`。

**限流不准 / 日志里客户端 IP 都是内网地址** — `TRUSTED_PROXIES` 要覆盖 Caddy
容器在 compose 网络里的地址段。默认 `172.16.0.0/12` 适用于 Docker 默认网段，
自定义过网络的话用 `docker network inspect omnigate_omnigate-network` 确认。

## 关于 AGPL

Omnigate 基于 [new-api](https://github.com/QuantumNous/new-api)，AGPL-3.0
许可。该许可要求：通过网络向用户提供服务时，必须向这些用户提供完整的对应源码。

私有仓库本身不违规，但对外提供服务后需要有履行途径 —— 常见做法是仓库转
public，或在站内放源码获取入口。若希望闭源商业运营，需联系上游获取商业授权
（见 `LICENSE`）。

