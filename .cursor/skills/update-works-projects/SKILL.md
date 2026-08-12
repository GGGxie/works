---
name: update-works-projects
description: 一键扫描 /root/Document/ 下的所有项目，更新 works.gggxie.com 的项目列表配置并重新构建部署。用于添加新项目、更新项目信息、同步 Cloudflare Tunnel 域名。当用户提到更新 works 站点、更新项目列表、添加项目到作品集、同步项目信息时使用。
---

# 一键更新 Works 项目列表

## 架构概览

Works 站点 (works.gggxie.com) 是一个 React + Vite 静态站点，通过 `/config/projects.json` 加载项目数据。

| 组件 | 路径 / 地址 |
|------|------------|
| 项目配置 | `/root/Document/works/public/config/projects.json` |
| Works 源码 | `/root/Document/works/` |
| 构建产物 | `/root/Document/works/dist/` |
| Nginx 配置 | `/etc/nginx/conf.d/` |
| Tunnel 配置 | `/etc/cloudflared/config.yml` |

## 已知项目清单

所有项目代码在 `/root/Document/` 下。用 `ls /root/Document/` 发现项目目录。

已知项目域名映射（通过 Cloudflare Tunnel，截至 2026-08）:

| 项目 | 域名 | 本地端口 |
|------|------|---------|
| crazyA | crazya.gggxie.com | 8080 (nginx) |
| works | works.gggxie.com | 8082 (nginx) |
| SkillsHub | skills.gggxie.com | 8083 (nginx) |
| MCPark | mcpark.gggxie.com | 8085 (nginx) |
| HAP 应用 | hap.gggxie.com | 8087 (docker)，需账号登录 |
| HAP 官网 | gggxie.com / www.gggxie.com | 8089 (docker) |
| ReditCN | reddit.gggxie.com | 8090 (nginx) |

新增域名时用现有 origin cert 建 DNS 记录，不需要额外 API Token:

```bash
cloudflared tunnel route dns 649a62a1-1213-4c48-963b-9a66f37c83fa <hostname>
```

站点自带的服务面板 `/lab` 会自动读取这份 ingress 配置做探活，新增域名后无需登记；
只有项目路径、运行方式一类的备注需要手动补到 `public/config/private.json`（不入库）。

查看最新域名映射: `cat /etc/cloudflared/config.yml`

隧道里配了 hostname 不等于线上可用，写入 `links.demo` 前先逐个探活:

```bash
curl -s -o /dev/null -w "%{http_code}\n" -m 10 https://<hostname>
```

## 更新流程

### Step 1: 扫描项目

```bash
ls /root/Document/
```

对每个项目目录（排除 `works` 和 `articles`）:
1. 读取 `README.md` 获取项目名称、描述、技术栈
2. 检查 `package.json`、`go.mod` 等确认技术栈标签

### Step 2: 获取域名信息

```bash
cat /etc/cloudflared/config.yml
```

从 ingress 规则中提取 hostname → 匹配到对应项目作为 demo 链接。

### Step 3: 更新 projects.json

读取当前配置:

```bash
cat /root/Document/works/public/config/projects.json
```

按以下 schema 更新 `projects` 数组:

```json
{
  "id": "project-dir-name",
  "name": "项目显示名称",
  "description": "一句话描述（50字以内）",
  "longDescription": "详细描述（100-200字）",
  "tags": ["Go", "React", "Python"],
  "links": {
    "github": "https://github.com/GGGxie/RepoName",
    "demo": "https://subdomain.gggxie.com"
  },
  "featured": true,
  "date": "YYYY-MM",
  "status": "active"
}
```

规则:
- `id` 使用目录名小写
- `links.demo` 仅在 hostname 探活返回 200 时才添加
- `links.github` 从 README 或 Git remote 获取，且必须确认仓库是公开的（`curl -o /dev/null -w '%{http_code}' https://github.com/GGGxie/<Repo>` 返回 404 说明私有，此时不要写 github 链接）
- `image` 为可选预览图，放在 `public/images/projects/<id>.png`，抓取方式见 Step 3.5
- `status` 用 `wip` 标记只有原型/文档的项目，卡片会显示"开发中"徽标
- `tags` 从实际技术栈提取（检查 package.json, go.mod, requirements.txt 等）
- `date` 优先使用 git log 最早提交日期，无 git 时使用目录创建时间
- `featured` 默认 `false`，已有的保持不变
- 保留已有项目的手动编辑字段（如 longDescription），仅补充缺失字段或新增项目

### Step 3.5: 抓取预览图（可选）

对有线上地址的项目，用本机 headless Chrome 抓 16:10 首屏图：

```bash
google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=1200,750 --virtual-time-budget=12000 \
  --screenshot=/root/Document/works/public/images/projects/<id>.png https://<hostname>
```

如果项目自带官网/落地页（例如 HAP 的 `landing/`，本地 8089），优先截官网而不是登录页。

### Step 4: 构建并部署

```bash
cd /root/Document/works && npm run build
```

构建完成后 nginx 自动从 `dist/` 目录提供服务，无需重启。

### Step 5: 验证

先做一次数据侧校验，确认 nginx 吐出的是新配置：

```bash
curl -s https://works.gggxie.com/config/projects.json | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d['projects']))"
```

再做可视化验证。没有 Playwright MCP 时，用 headless Chrome 截长图人工看一眼即可：

```bash
google-chrome --headless=new --no-sandbox --disable-gpu --hide-scrollbars \
  --window-size=1440,2450 --virtual-time-budget=15000 \
  --screenshot=/tmp/works-home.png "https://works.gggxie.com/?t=$(date +%s)"
```

Playwright MCP 可用时，按以下顺序调用：

1. **打开首页**：调用 `browser_navigate`，url 设为 `https://works.gggxie.com`
2. **截图首页**：调用 `browser_take_screenshot`，保存首页截图确认页面正常渲染
3. **获取页面快照**：调用 `browser_snapshot`，检查页面结构中是否包含所有项目名称
4. **进入项目列表页**：通过 `browser_click` 点击导航中的"项目"链接
5. **截图项目页**：调用 `browser_take_screenshot`，确认所有项目卡片均已展示
6. **最终校验**：对比 `browser_snapshot` 返回的项目名称列表与 `projects.json` 中的项目，确保一致

验证通过标准：
- 页面正常渲染，无白屏或报错
- 所有项目卡片可见（名称、描述、标签）
- 有 demo 链接的项目显示 demo 按钮

## 注意事项

- 不要覆盖用户手动编辑的 `profile` 字段
- 新项目默认 `featured: false`
- 如需添加新域名，需同时更新 `/etc/cloudflared/config.yml` 和 nginx 配置，并重启服务:
  ```bash
  systemctl restart cloudflared
  systemctl reload nginx
  ```
