# Stone Badge 部署说明

Stone Badge 是一个基于 GitHub 仓库最近一次提交 SHA 生成石墩子 SVG 徽章的 Node.js 服务。项目本身没有前端构建步骤，启动后会直接提供静态页面和 API：

- 首页：可选调整生成参数，输入 GitHub 仓库地址并生成徽章
- API：按仓库 owner / repo 返回着色后的 SVG；可通过查询参数控制模板生成（帧数、最小三角面积、减面强度、动画时长）
- 某一组参数首次被使用时，服务端会在 **`templates/cache/`** 中生成并缓存未着色模板

## 目录说明

```text
project/
├── server.js              # 服务入口
├── lib/                   # 业务逻辑（模板生成、着色、GitHub API）
├── public/                # 静态前端页面
├── templates/
│   └── cache/             # 运行时生成的未着色 SVG 模板（按参数哈希命名）
├── seatstone.glb          # 3D 模型文件，必须保留
├── package.json
└── README.md
```

## 运行要求

- Node.js 18 或更高版本
- npm
- 服务器可以访问 GitHub API：`https://api.github.com`
- 服务器上要保留 `seatstone.glb` 文件

为什么建议 Node.js 18+：项目代码使用了原生 `fetch`，并且 `package.json` 采用 ESM 模式。

## 环境变量

项目可用的环境变量只有两个：

- `PORT`：服务监听端口，默认 `3000`
- `GITHUB_TOKEN`：可选。建议配置，用于提高 GitHub API 限流上限，避免高频访问时触发 rate limit

示例：

```bash
export PORT=3000
export GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
```

## 本地启动

如果你只是想先在服务器上直接跑起来，可以按下面的步骤执行：

```bash
cd /path/to/project
npm install
npm start
```

启动后默认访问：

- 首页：`http://服务器IP:3000/`

服务启动时会尝试**预热**默认参数对应的缓存模板（写入 `templates/cache/`）。其他参数组合会在首次被请求时再生成。若生成失败，请检查服务日志、`seatstone.glb` 是否存在，以及 `templates/`（含 `templates/cache/`）是否可写。

## 服务器部署步骤

下面以 Linux 服务器为例，推荐使用 `systemd + Nginx` 的方式部署。这样可以保证服务开机自启，并通过反向代理提供 80 / 443 端口访问。

### 1. 准备目录

建议把项目放到一个固定目录，例如：

```bash
sudo mkdir -p /opt/stone-badge
```

把项目文件上传或拉取到该目录，确保最终目录中至少包含：

```text
server.js
package.json
lib/
public/
seatstone.glb
```

如果缺少 `seatstone.glb`，自动模板生成和 SVG 着色流程都无法正常工作。

如果模板自动生成失败，通常是 `seatstone.glb` 缺失、Node 版本不满足要求，或者服务器没有写入 `templates/` 的权限。

### 2. 安装依赖

```bash
cd /opt/stone-badge
npm install
```

安装完成后，`node_modules` 会生成在项目目录下。项目没有额外的构建步骤。

### 3. 配置服务账号和写权限

为了让模板生成能正常写入，建议先确保 `templates/` 与 `templates/cache/` 存在且可写：

```bash
sudo mkdir -p /opt/stone-badge/templates/cache
sudo chown -R www-data:www-data /opt/stone-badge/templates
```

如果你打算用别的用户运行 systemd 服务，也可以把上面的 `www-data` 换成对应用户名，但一定要保证 `templates/` 可写。

### 4. 配置环境变量

推荐把环境变量写入单独文件，便于 systemd 管理：

```bash
sudo tee /etc/stone-badge.env >/dev/null <<'EOF'
PORT=3000
GITHUB_TOKEN=ghp_xxxxxxxxxxxxxxxxxxxx
EOF
```

如果暂时不想配置 GitHub Token，也可以只写 `PORT`，但在访问量较高时更容易触发 API 限流。

### 5. 先手动验证一次启动

```bash
cd /opt/stone-badge
PORT=3000 npm start
```

第一次启动时，服务会尝试预生成**默认参数**下的缓存文件（位于 `templates/cache/`）。如果失败，请查看服务日志、确认 `seatstone.glb` 存在，并检查 `templates/` 可写。本地开发也可在项目根目录执行 `node lib/template-generator.js`，会生成 `templates/stone-template.svg` 供离线查看（HTTP 接口实际使用按参数区分的 `templates/cache/`）。

### 6. 配置 systemd 开机自启

创建服务文件：

```bash
sudo tee /etc/systemd/system/stone-badge.service >/dev/null <<'EOF'
[Unit]
Description=Stone Badge Service
After=network.target

[Service]
Type=simple
WorkingDirectory=/opt/stone-badge
EnvironmentFile=/etc/stone-badge.env
ExecStart=/usr/bin/node /opt/stone-badge/server.js
Restart=always
RestartSec=5
User=www-data
Group=www-data

[Install]
WantedBy=multi-user.target
EOF
```

如果你的 Node.js 安装路径不是 `/usr/bin/node`，请先运行：

```bash
which node
```

然后把上面的 `ExecStart` 改成实际路径。

接着加载并启动服务：

```bash
sudo systemctl daemon-reload
sudo systemctl enable stone-badge
sudo systemctl start stone-badge
sudo systemctl status stone-badge
```

查看日志：

```bash
sudo journalctl -u stone-badge -f
```

## Nginx 反向代理

建议不要直接把 3000 端口暴露给公网，而是让 Nginx 监听 80 / 443，再把请求转发到本地的 Node 服务。

下面是一个基础配置示例：

```nginx
server {
    listen 80;
    server_name badge.example.com;

    client_max_body_size 20m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

说明：

- `client_max_body_size` 一般不必很大；`POST /api/generate` 仅提交较小 JSON。若日后增加接收大文件的上传接口再相应调大。
- 如果你后面接入 HTTPS，只需要给这个 `server` 块补充证书配置即可

启用配置后执行：

```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 如果开启了防火墙

如果服务器使用 `ufw`，建议只开放 80 和 443：

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

如果你不使用 Nginx，而是直接暴露 Node 端口，则至少要开放 `PORT` 对应端口，但不推荐这种方式用于生产环境。

## 首次上线检查清单

- 首页能正常打开
- `seatstone.glb` 可以从浏览器直接请求到
- 首次预热或首次请求后，`templates/cache/` 下出现 `stone-*.svg`（或日志无生成错误）
- 输入一个 GitHub 仓库链接后可以返回徽章
- 反向代理后静态资源和 API 都能正常工作

## API 说明

### 1. 获取 SVG 徽章

```text
GET /api/stone/:owner/:repo
```

可选 **查询参数**（短参数名；省略则使用服务端默认值）：

| 参数 | 别名 | 含义 |
|------|------|------|
| `f` | `frames` | 旋转动画帧数（限制在 8–32） |
| `a` | `minArea` | 投影后最小三角形面积，越小越细、SVG 越大 |
| `s` | `simplify` | 网格减面强度：SimplifyModifier 边折叠迭代次数（0–3000） |
| `d` | `animDuration` | 单圈旋转动画时长（秒，限制在 4–60） |

示例（省略参数即默认）：

```text
GET /api/stone/vercel/next.js
```

显式指定参数示例：

```text
GET /api/stone/vercel/next.js?f=16&a=1.2&s=0&d=10
```

返回 `image/svg+xml` 的 SVG 内容。

### 2. 解析仓库链接

```text
POST /api/generate
```

请求体：

```json
{
  "repoUrl": "https://github.com/owner/repo",
  "frameCount": 16,
  "minFaceArea": 1.2,
  "simplifyCollapses": 0,
  "animDuration": 10
}
```

仅 `repoUrl` 必填；其余字段与 GET 查询参数含义、范围一致，服务端会先 `clamp` 再写入缓存。响应 JSON 包含 `owner`、`repo`、`sha`（短 SHA）、`badgeUrl`（带查询串的路径）、`generateOptions`（规范化后的参数）。

## 常见问题

### 1. 徽章请求失败或日志中报模板生成错误

多为 `seatstone.glb` 缺失、Node 版本过低，或 `templates/`、`templates/cache/` 不可写。处理方法：

1. 确认 `seatstone.glb` 与 `server.js` 在同一项目根目录
2. 查看服务日志中的模板生成错误
3. 执行 `mkdir -p templates/cache`，保证 `templates/` 可写后重启服务

### 2. GitHub API 访问失败或限流

通常是因为没有配置 `GITHUB_TOKEN`，或者服务器出口网络不通。建议：

1. 确认服务器可以访问 `api.github.com`
2. 配置 `GITHUB_TOKEN`
3. 检查代理、防火墙和 DNS

### 3. 首次打开某组参数很慢

某一组 `f`/`a`/`s`/`d` **第一次**被请求时需要完整跑一遍 3D 转 SVG；相同参数之后会直接使用 `templates/cache/` 中的文件。

### 4. 服务启动后立刻退出

检查：

1. Node.js 版本是否是 18 以上
2. `ExecStart` 里的 Node 路径是否正确
3. `WorkingDirectory` 是否指向项目根目录
4. `journalctl -u stone-badge -f` 的报错内容

## 更新发布流程

以后更新代码时，建议按下面的流程：

```bash
cd /opt/stone-badge
git pull
npm install
sudo systemctl restart stone-badge
```

如果这次更新没有修改依赖，`npm install` 也可以省略，但保留执行习惯更稳妥。

## 备注

- 项目没有前端打包流程，`public/` 下的文件会被直接静态托管
- 未着色模板由服务端生成并保存在 `templates/cache/`；接口返回的着色 SVG 是在内存中根据该文件与仓库 SHA 计算得到
- 服务器部署时最推荐的方式是：`systemd` 保活 + `Nginx` 反向代理 + `GITHUB_TOKEN` 降低限流风险