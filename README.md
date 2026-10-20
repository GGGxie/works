# works

个人作品集站点，线上地址 [works.gggxie.com](https://works.gggxie.com)。

项目数据全部来自一份 JSON 配置，站点在构建时把每个页面预渲染成静态 HTML，所以分享到微信/Slack 有内容摘要，搜索引擎也能直接读到正文。

## 技术栈

React 19 + TypeScript + Vite 7，路由用 react-router v7，文案用 i18next 做中英双语，图标用 lucide-react。样式是手写 CSS + CSS 变量，支持浅色/深色主题。没有 UI 框架和 CSS 预处理器。

## 目录结构

```
public/config/projects.json   项目与个人信息（唯一数据源）
public/images/projects/       各项目预览图
public/og-image.png           分享卡片图（由 scripts/ 生成）
src/pages/                    首页、项目详情、关于
src/components/               Header / Footer / ProjectCard 等
src/entry-server.tsx          预渲染入口（renderToString）
scripts/prerender.mjs         构建后逐路由生成静态 HTML + sitemap
scripts/inventory-projects.mjs 扫描本机项目并生成私有清单
scripts/og-card.html          分享卡片的设计源
scripts/make-og.mjs           截图并裁成 1200x630
```

## 常用命令

```bash
npm run dev       # 本地开发（纯客户端渲染，配置走 fetch）
npm run build     # 客户端构建 + SSR 构建 + 预渲染，产物在 dist/
npm run og        # 重新生成 public/og-image.png
npm run inventory # 扫描 /root/Document 并更新私有项目清单
npm run inventory:check # 只校验和预览统计，不写文件
npm test          # 项目清单单元测试
npm run lint      # ESLint
```

`npm run build` 是三步串起来的：先 `build:client` 出常规静态产物，再 `build:ssr` 把 `entry-server.tsx` 打成 Node 可执行的 bundle，最后 `prerender` 用它把每个路由渲染成 HTML。

## 加一个项目

编辑 `public/config/projects.json` 的 `projects` 数组，然后 `npm run build`。字段说明：

| 字段 | 说明 |
|------|------|
| `id` | 详情页路径为 `/projects/<id>`，用小写短横线 |
| `name` / `name_en` | 卡片和详情页标题 |
| `description` / `description_en` | 一句话描述，同时用作该页的 meta description |
| `longDescription` | 详情页正文，100–200 字 |
| `tags` | 技术栈，卡片展示前 3 个；被 2 个以上项目共用的标签会出现在筛选栏 |
| `image` | 预览图，建议 16:10，放在 `public/images/projects/` |
| `links.demo` | 线上地址，确认能访问再填 |
| `links.github` | 仓库地址，仅公开仓库才填，否则访客会撞 404 |
| `date` | `YYYY-MM`，用于排序和年份显示 |
| `status` | `active` / `wip` / `archived`，`wip` 会显示"开发中"徽标 |

预览图用无头 Chrome 截线上首屏即可：

```bash
google-chrome --headless=new --no-sandbox --hide-scrollbars \
  --window-size=1200,750 --virtual-time-budget=12000 \
  --screenshot=public/images/projects/<id>.png https://<项目域名>
```

## 自用视图 /lab

`/lab` 是给自己看的项目控制台：汇总本机目录、Git 状态、GitHub 匹配、works 展示状态、飞书项目总览入口，以及所有对外服务的公网/本地可达性和运维备忘。它是只读视图，不负责启动、停止或部署项目。

数据有两个来源，都不入库：

- `config/health.json` 由 `npm run probe` 生成，服务清单直接读 Cloudflare Tunnel 的 ingress 配置，所以新增域名不需要另行登记。cron 每 5 分钟跑一次，`npm run build` 结束时也会跑一次。
- `config/private.json` 一部分手写（`notes`、`offline`、`ops`），一部分由 `npm run inventory` 生成（`inventory`、`projects`）。生成器会保留手写内容和飞书/GitHub 入口。

这两个文件带本地端口等自用信息，所以 nginx 侧有访问闸门：本机直连放行，经 Cloudflare Tunnel 进来的请求必须带上正确的 `?k=`（key 在 `works.conf` 的 map 里）。导航里的入口只在本机或浏览器存过 key 时出现，预渲染出的静态 HTML 不含任何相关痕迹。

## 项目管理工作流

三套系统各管一类事实，避免重复维护：

- **GitHub** 管代码、Issue 和 Pull Request。具体开发任务放在对应项目仓库；跨项目导航使用 [works 协调 Issue](https://github.com/GGGxie/works/issues/1)。
- **飞书多维表格** 管项目生命周期、优先级、运行状态和下一步行动。它是日常查看与整理项目组合的主界面。
- **本机 `/root/Document/`** 管真实目录、Git 分支和工作区状态；works 扫描这些元数据并投影到 `/lab`。

目录或 Git 关系变化后，按下面顺序更新：

```bash
npm run inventory:check
npm run inventory
npm test
npm run lint
npm run build
```

扫描器只检查顶层目录、常见清单文件名和 Git 元数据，不读取源码、`.env`、凭据或提交正文。无法确定用途的目录会进入“待分类”，不会自动标成活跃项目。`public/config/private.json` 已被 Git 忽略，里面的本地路径、私有仓库信息、飞书标识和运维命令不得复制到公开配置。

## 部署

nginx 直接把 `dist/` 作为站点根目录（配置在 `/etc/nginx/conf.d/works.conf`，监听 8082），外网通过 Cloudflare Tunnel 接入，所以 `npm run build` 完成即上线，不需要重启服务。

nginx 侧有两点是配合预渲染的：`try_files $uri $uri/index.html /index.html` 让 `/projects/hap` 这类路径直接命中预渲染文件而不产生补斜杠跳转；HTML 响应带 `no-cache`，因为项目配置被内联进了 HTML。
