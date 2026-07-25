# Omnigate 部署实录

本文是 2026-07 首次上线时**实际执行过的命令**，按顺序记录，含遇到的问题和处理。

通用部署指南见 [VPS.md](./VPS.md)。两者的区别：VPS.md 讲怎么做和为什么，本文
是可直接复制的命令流水，用于复现或重建。

**密钥不在本文中。** 所有 `openssl rand` 生成的值只存在服务器的 `.env` 里。

## 实际环境

| 项 | 值 |
| --- | --- |
| VPS | RackNerd，阿姆斯特丹 AMS109 |
| IP | 23.94.105.187 |
| 系统 | Ubuntu 24.04 LTS，KVM |
| 配置 | 2 核 / 2.4 GB 内存 / 43 GB 磁盘 |
| 域名 | omnigate.cc（Cloudflare 托管，**灰云** DNS only） |
| 数据库 | PostgreSQL 15 + Redis 7（容器内，不对外） |

## 一、本机：仓库初始化与推送

项目最初是源码包而非 clone，没有 git 历史。

```bash
cd /Users/tao/Desktop/omnigate
git init
git add -A
git commit -m "Initial commit: Omnigate"
git remote add origin https://github.com/DingxinTao0417/omnigate.git
```

推送需要 GitHub 认证，`gh auth login` 是交互式的（选 GitHub.com → HTTPS →
浏览器登录）。完成后让 git 走 gh 取凭据：

```bash
git config --local credential.https://github.com.helper "!/opt/homebrew/bin/gh auth git-credential"
git push -u origin main
```

### 坑：Homebrew 装 Go 卡死

后端一次都没编译验证过，需要本机装 Go。`brew install go` 从 ghcr.io 下载
bottle 卡在 50 MB 不动（连接挂起，4 分钟零字节增长）。改用阿里云镜像：

```bash
kill <curl_pid> <brew_pid>          # 先终止卡住的 brew
curl -L -o go.tar.gz https://mirrors.aliyun.com/golang/go1.26.5.darwin-arm64.tar.gz
tar -C "$HOME/.local" -xzf go.tar.gz
"$HOME/.local/go/bin/go" version    # go1.26.5 darwin/arm64
```

装在 `~/.local/go`，未加入 PATH。要日常使用，往 `~/.zshrc` 加：

```bash
export PATH="$HOME/.local/go/bin:$PATH"
export GOPROXY=https://goproxy.cn,direct
```

编译验证（`go mod download` 走国内代理，否则很慢）：

```bash
cd /Users/tao/Desktop/omnigate
export GOPROXY=https://goproxy.cn,direct GOSUMDB=sum.golang.google.cn
go mod download
go build ./...                      # exit 0
```

## 二、Cloudflare DNS

面板操作，无命令。给 `omnigate.cc` 加两条 A 记录：

| Type | Name | 值 | Proxy |
| --- | --- | --- | --- |
| A | `@` | 23.94.105.187 | **DNS only（灰云）** |
| A | `www` | 23.94.105.187 | **DNS only（灰云）** |

灰云是刻意选择：Cloudflare 免费版代理单请求 100 秒上限，会截断大模型长回答的
流式输出；且橙云会让 Let's Encrypt 的 HTTP-01 校验拿到 CF 的 IP 导致发证失败。

本机验证解析生效：

```bash
dig +short omnigate.cc              # 23.94.105.187
```

## 三、服务器：SSH 与系统准备

重装系统后 host key 变了，SSH 会报 `REMOTE HOST IDENTIFICATION HAS CHANGED`。
确认是自己重装导致的之后清掉旧记录：

```bash
ssh-keygen -R 23.94.105.187
ssh root@23.94.105.187
```

以下均在服务器上执行（root）：

```bash
apt update && apt upgrade -y
apt install -y ca-certificates curl gnupg git ufw fail2ban
```

Docker 官方源（Ubuntu 仓库的 docker.io 偏旧）：

```bash
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

实测得到 Docker 29.6.2 / Compose v5.3.1。

防火墙。`allow OpenSSH` 必须在 `enable` 之前，否则会把自己关在门外：

```bash
ufw allow OpenSSH && ufw allow 80/tcp && ufw allow 443/tcp && ufw allow 443/udp \
  && ufw --force enable && ufw status
```

数据库和 Redis 不需要开端口 —— compose 里它们没有 `ports:`，只在内部网络可达。

## 四、服务器：拉代码与配置

```bash
mkdir -p /opt && cd /opt
git clone https://github.com/DingxinTao0417/omnigate.git
cd omnigate
```

仓库是 private，会要求认证。用户名 `DingxinTao0417`，**密码填 Personal Access
Token**（GitHub 不再支持密码认证），token 在 GitHub → Settings → Developer
settings → Tokens (classic)，勾 `repo` 权限。

加 swap。机器原本没有 swap，2.4 GB 内存跑 bun 打包前端有 OOM 风险：

```bash
fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
echo '/swapfile none swap sw 0 0' >> /etc/fstab
free -h
```

生成密钥。自动填充四个随机值，避免手抄出错：

```bash
cd /opt/omnigate
cp .env.prod.example .env
for k in POSTGRES_PASSWORD REDIS_PASSWORD SESSION_SECRET CRYPTO_SECRET; do
  sed -i "s|^$k=.*|$k=$(openssl rand -hex 32)|" .env
done
sed -i 's|^ACME_EMAIL=.*|ACME_EMAIL=taodingxin0417@gmail.com|' .env
chmod 600 .env
```

验证时只看键名和长度，不要输出实际内容：

```bash
awk -F= '/^[A-Z]/ {printf "%s = %d chars\n", $1, length($2)}' .env
```

四个密钥应各为 64 chars。

## 五、服务器：构建启动

`nohup` 后台跑 —— 直接跑的话 SSH 一断 BuildKit 会取消构建：

```bash
cd /opt/omnigate
nohup docker compose -f docker-compose.prod.yml up -d --build > build.log 2>&1 &
tail -f build.log                   # Ctrl-C 退出不影响后台构建
```

2 核机器实测约 15 分钟。`RUN go build` 那一步会长时间无输出，是正常的 —— 要编译
40+ 个 provider 适配器，且 `-ldflags "-s -w"` 的链接阶段单线程。想确认没卡死，
另开窗口看 `top -bn1 | head -15`，有 `go`/`compile`/`link` 占 CPU 即正常。

日志出现 `Container caddy Started` 即完成。

## 六、验证

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs caddy 2>&1 | grep -iE "certificate|error"
curl -sI https://omnigate.cc | head -5
```

首次上线时的实际结果：

- 四个容器 `Up`，其中 omnigate / postgres / redis 为 `healthy`
- `certificate obtained successfully` 两次（omnigate.cc 与 www.omnigate.cc）
- `HTTP/2 200`

Caddy 会警告 `no OCSP stapling` —— Let's Encrypt 自 2025 年起不再提供 OCSP
响应地址，可忽略，不影响证书有效性。

本机侧外部验证：

```bash
curl -s https://omnigate.cc/ | grep -o "<title>[^<]*</title>"      # Omnigate
curl -s https://omnigate.cc/api/status | python3 -m json.tool | head
curl -sI http://omnigate.cc | grep -iE "^HTTP|^location"            # 308 -> https
curl -sI https://www.omnigate.cc | grep -iE "^HTTP|^location"       # 301 -> apex
echo | openssl s_client -connect omnigate.cc:443 -servername omnigate.cc 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

确认内部端口未暴露：

```bash
for p in 5432 6379 3000; do
  timeout 6 bash -c "echo > /dev/tcp/omnigate.cc/$p" 2>/dev/null \
    && echo "!! $p 可访问" || echo "ok $p 不可达"
done
```

## 七、初始化后的后台设置

浏览器打开 `https://omnigate.cc` 走向导，创建管理员账号。之后：

- **登录注册 → 注册已启用**：关闭。公网站点开着自助注册会被白嫖额度。
- **站点与品牌 → 系统信息 → 服务器地址**：改为 `https://omnigate.cc`
  （默认仍是 `http://localhost:3000`，影响支付回调和邮件链接）。
- **首页内容**：留空才会显示自带落地页。此字段一旦有值就完全替换掉
  Hero/Stats/Features 那套组件（见 `web/src/features/home/index.tsx:94`）。

单渠道部署额外注意（只配了一个上游代理商 key 时）：

- 渠道的**自动禁用**（`auto_ban`）建议关闭。单渠道被禁用会导致全站所有模型立即
  不可用，直到人工恢复（`controller/relay.go:293`）。
- 开启**成功后重新启用**，被误禁后可自动恢复。
- 项目**没有渠道级并发限制**，只能用「速率限制」板块的用户级配额保护上游。注意
  它按用户账号计数，多账号不互相限制。

## 八、数据库备份

`bin/backup-db.sh` 导出 gzip 压缩的 dump 到 `/opt/omnigate/backups/`，保留
14 天。先手动跑一次：

```bash
cd /opt/omnigate && ./bin/backup-db.sh
```

**验证备份可用** —— 没验证过的备份等于没有备份：

```bash
gunzip -c /opt/omnigate/backups/omnigate-*.sql.gz | grep -c "CREATE TABLE"
```

首次上线时返回 34（表数量），文件 23 KB。

加 cron，每天 4:17（避开整点，此时负载低）：

```bash
mkdir -p /opt/omnigate/logs
crontab -l 2>/dev/null | { cat; echo "17 4 * * * /opt/omnigate/bin/backup-db.sh >> /opt/omnigate/logs/backup.log 2>&1"; } | crontab -
```

cron 的 PATH 比登录 shell 窄，脚本依赖 `docker compose`，所以要模拟 cron 环境
验一次，否则可能第二天才发现没跑：

```bash
env -i PATH=/usr/bin:/bin /opt/omnigate/bin/backup-db.sh
```

恢复：

```bash
gunzip -c backups/omnigate-20260725-230354.sql.gz \
  | docker compose -f docker-compose.prod.yml exec -T postgres psql -U omnigate -d omnigate
```

dump 用 `--clean --if-exists` 生成，会先删除同名对象再重建，可直接覆盖恢复。

## 待办

- 备份只在本机，防误删和逻辑损坏，**防不了整机故障**。异地副本可从本机
  `scp root@23.94.105.187:/opt/omnigate/backups/*.sql.gz ~/omnigate-backups/`，
  或用 rclone 同步到对象存储。
- AGPL-3.0 要求对外提供服务时向使用者提供源码。仓库当前为 private，正式开放前
  需确定履行方式（转 public、站内放源码入口，或联系上游取得商业授权）。
