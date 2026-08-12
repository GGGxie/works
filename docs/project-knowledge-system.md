# 项目全流程知识体系

> 建立系统化的项目开发认知框架，覆盖从立项到运维的完整生命周期。

**个人技术栈：**
- Web 前端：React + TypeScript
- 移动端：Flutter
- 后端：Golang / Python

---

## 目录

1. [项目类型分类](#一项目类型分类)
2. [项目生命周期](#二项目生命周期)
3. [技术栈维度](#三技术栈维度)
4. [横切关注点](#四横切关注点)
5. [包 / 库发布指南](#五包--库发布指南)
6. [知识库组织结构](#六知识库组织结构)
7. [常用 Checklist](#七常用-checklist)

---

## 一、项目类型分类

| 类型 | 常见形态 | 个人技术栈 |
|------|----------|------------|
| Web 前端 | SPA、SSR、SSG、MPA | **React + TypeScript + Vite** |
| 移动端 | Native、跨平台 | **Flutter (Dart)** |
| 后端服务 / API | REST、GraphQL、微服务 | **Golang / Python** |
| Web 全栈 | 前后端一体化 | Next.js（含 API Routes） |
| 桌面端 | 跨平台桌面应用 | Tauri（Rust + React） |
| CLI 工具 | 命令行工具 | Go / Python |
| 库 / SDK / 组件库 | 供他人使用的包 | Python（PyPI）/ Go Module |
| 基础设施工具 | DevOps 脚本、自动化 | Shell、Python、Ansible |

---

## 二、项目生命周期

```
立项 → 调研 → 设计 → 开发 → 测试 → 部署 → 运维 → 迭代
```

### 2.1 立项

- 需求来源：个人想法 / 客户需求 / 产品规划
- 目标定义：解决什么问题，服务谁
- 可行性评估：技术可行性、资源可行性、时间可行性
- 工期估算：拆解任务，评估工时
- 成功指标定义（KPI/OKR）

### 2.2 调研

- 竞品分析：功能对比、优劣势分析
- 用户调研：目标用户画像、使用场景
- 技术调研：
  - 有无开源方案可复用
  - 第三方 API / 服务选型
  - 技术风险识别

### 2.3 设计

**产品设计**
- 用户流程图（User Flow）
- 原型图（Wireframe）
- 视觉稿（UI Design）
- 交互设计规范

**技术设计**
- 系统架构图
- 数据库 ER 图 / Schema 设计
- API 接口设计（RESTful / GraphQL）
- 目录结构设计
- 状态管理方案
- 错误处理策略

### 2.4 开发

**环境搭建**
- 本地开发环境配置
- 环境变量管理（`.env` 分层：local / dev / prod）
- 编辑器配置（EditorConfig、VSCode settings）

**规范建立**
- 代码风格：ESLint + Prettier
- 提交规范：Conventional Commits（`feat/fix/docs/chore`）
- 命名规范：文件、变量、组件、API 路由

**版本管理**
- 分支策略：`main` / `develop` / `feature/*` / `hotfix/*`
- PR / Code Review 流程
- Changelog 维护

**开发流程**
- 任务拆解与追踪（GitHub Issues / Linear / Notion）
- 组件驱动开发（Storybook）
- API Mock（MSW / json-server）

### 2.5 测试

| 测试类型 | 目的 | 工具 |
|----------|------|------|
| 单元测试 | 验证函数/组件逻辑 | Vitest、Jest |
| 集成测试 | 验证模块协作 | Testing Library |
| E2E 测试 | 验证完整用户流程 | Playwright、Cypress |
| 性能测试 | 评估加载与运行速度 | Lighthouse、WebPageTest |
| 安全测试 | 漏洞扫描 | OWASP ZAP |
| 可访问性测试 | A11y 合规检查 | axe-core |

**测试原则**
- 测试金字塔：单元 > 集成 > E2E（数量比）
- 关键路径必须有 E2E 覆盖
- CI 中自动运行测试，失败则阻断合并

### 2.6 部署

**CI/CD 流水线**
```
代码推送 → 自动测试 → 构建产物 → 部署到环境 → 通知
```

**环境管理**

| 环境 | 用途 | 访问权限 |
|------|------|----------|
| local | 本地开发 | 开发者 |
| dev / preview | 功能验证 | 团队内部 |
| staging | 预发布，与生产一致 | 内部测试 |
| production | 正式上线 | 公开 |

**部署方式选型**

| 方式 | 适用场景 | 代表平台 |
|------|----------|----------|
| 静态托管 | 纯前端 / 静态站点 | Vercel、Cloudflare Pages、GitHub Pages |
| 容器化部署 | 全栈 / 后端服务 | Docker + VPS、Railway、Fly.io |
| Serverless | 轻量 API / 边缘函数 | Cloudflare Workers、AWS Lambda |
| 传统服务器 | 自托管、成本控制 | VPS + Nginx + PM2 |

**容器化实践**
- `Dockerfile` 多阶段构建
- `docker-compose.yml` 本地服务编排
- 环境变量注入策略

### 2.7 运维

- **监控告警**：服务可用性、响应时间、错误率（UptimeRobot、Grafana）
- **错误追踪**：前端异常捕获（Sentry）
- **日志管理**：结构化日志、日志聚合（Loki、CloudWatch）
- **性能监控**：Core Web Vitals、APM（Datadog）
- **备份策略**：数据库定期备份、异地备份
- **安全更新**：依赖漏洞扫描（`npm audit`、Dependabot）

### 2.8 迭代

- 用户反馈收集（热力图、用户访谈）
- 版本发布策略（语义化版本 SemVer）
- 技术债管理：定期 Refactor Sprint
- 复盘文档：做了什么、遇到什么问题、下次怎么改进

---

## 三、技术栈维度

### 3.1 Web 前端（React）

| 层级 | 选用 | 备选 |
|------|------|------|
| 框架 | **React 19** | — |
| 元框架 | **Next.js**（SSR/SSG） | Astro（纯静态） |
| 构建工具 | **Vite** | Turbopack |
| 类型系统 | **TypeScript** | — |
| 状态管理 | **Zustand** | Jotai / Redux Toolkit |
| 数据请求 | **TanStack Query** | SWR |
| 样式方案 | **Tailwind CSS** | CSS Modules |
| 组件库 | **shadcn/ui** + Radix UI | Ant Design |
| 动画 | **Framer Motion** | GSAP |
| 表单 + 校验 | **React Hook Form** + **Zod** | — |
| 测试 | **Vitest** + Testing Library | Jest |
| E2E 测试 | **Playwright** | Cypress |

### 3.2 移动端（Flutter）

| 层级 | 选用 | 备选 |
|------|------|------|
| 语言 | **Dart** | — |
| 状态管理 | **Riverpod** | BLoC / Provider |
| 路由 | **go_router** | AutoRoute |
| 网络请求 | **Dio** | http |
| 本地存储 | **Hive** / **sqflite** | SharedPreferences |
| 国际化 | **flutter_localizations** | easy_localization |
| 依赖注入 | **get_it** | — |
| 测试 | flutter_test + mockito | — |
| 发布 | Android: Google Play / APK<br>iOS: App Store / TestFlight | — |

### 3.3 后端（Golang）

| 层级 | 选用 | 备选 |
|------|------|------|
| Web 框架 | **Gin** / **Fiber** | Echo / Chi |
| ORM | **GORM** | sqlx（原生 SQL） |
| 数据库 | **PostgreSQL** | MySQL / SQLite |
| 缓存 | **Redis**（go-redis） | — |
| 认证 | **JWT**（golang-jwt） | Session |
| 配置管理 | **Viper** | godotenv |
| 日志 | **Zap** | logrus |
| 测试 | **testing** 标准库 + testify | — |
| API 文档 | **Swagger**（swaggo） | — |
| 包发布 | Go Module（打 Tag 即发布） | — |

### 3.4 后端（Python）

| 层级 | 选用 | 备选 |
|------|------|------|
| Web 框架 | **FastAPI** | Flask / Django |
| ORM | **SQLAlchemy** + Alembic | Tortoise ORM |
| 数据库 | **PostgreSQL** | MySQL / SQLite |
| 缓存 | **Redis**（redis-py） | — |
| 认证 | **python-jose**（JWT） | — |
| 配置管理 | **pydantic-settings** | python-dotenv |
| 任务队列 | **Celery** + Redis | RQ |
| 包管理 | **uv**（推荐）/ pip | poetry |
| 测试 | **pytest** | unittest |
| 包发布 | **PyPI**（uv publish） | — |

### 3.5 基础设施

| 类别 | 工具 |
|------|------|
| 容器 | **Docker** / Docker Compose |
| 编排 | Kubernetes / Nomad |
| CI/CD | **GitHub Actions** |
| 代理/网关 | **Nginx** / Caddy / **Cloudflare Tunnel** |
| DNS / CDN | **Cloudflare** |
| 云平台 | AWS / GCP / 阿里云 |
| IaC | Terraform / Pulumi |

---

## 四、横切关注点

这些贯穿整个项目，不属于某一阶段，但每个阶段都需要考虑：

### 4.1 安全性

- 认证与鉴权（Authentication & Authorization）
- HTTPS 强制
- XSS / CSRF / SQL 注入防护
- 敏感数据加密（密码 Hash、传输加密）
- 最小权限原则
- 依赖漏洞管理（`npm audit`、Snyk）

### 4.2 性能

**前端性能**
- Core Web Vitals：LCP / FID / CLS
- 代码分割（Code Splitting）与懒加载
- 图片优化（WebP / AVIF、响应式图片、lazy load）
- 缓存策略（HTTP Cache、Service Worker）
- Bundle 分析（rollup-plugin-visualizer）

**后端性能**
- 数据库索引优化
- 查询 N+1 问题
- 缓存层（Redis）
- 连接池配置
- API 响应压缩（gzip / brotli）

### 4.3 可访问性（A11y）

- 语义化 HTML
- ARIA 属性
- 键盘导航支持
- 颜色对比度（WCAG AA 标准）
- 屏幕阅读器兼容

### 4.4 国际化（i18n）

- 文案外置（不在代码中硬编码中文/英文）
- 日期、数字、货币格式化
- 时区处理
- RTL 语言支持

### 4.5 SEO

- 语义化 HTML 结构
- Meta 标签（title、description、OG）
- 结构化数据（JSON-LD）
- Sitemap 与 robots.txt
- SSR / SSG 渲染策略

### 4.6 文档

| 文档类型 | 内容 | 受众 |
|----------|------|------|
| README | 项目简介、快速启动 | 所有人 |
| API 文档 | 接口规范（Swagger / Scalar） | 前端 / 第三方 |
| 技术文档 | 架构决策、方案说明 | 团队成员 |
| 用户文档 | 使用说明、FAQ | 最终用户 |
| CHANGELOG | 版本变更记录 | 使用者 |

---

## 五、包 / 库发布指南

### 5.1 Python 包发布（PyPI）

#### 项目结构

```
my-package/
├── src/
│   └── my_package/
│       ├── __init__.py
│       └── core.py
├── tests/
├── pyproject.toml        # 现代标准，替代 setup.py
├── README.md
└── .gitignore
```

#### `pyproject.toml` 配置

```toml
[build-system]
requires = ["hatchling"]
build-backend = "hatchling.build"

[project]
name = "my-package"
version = "0.1.0"
description = "..."
readme = "README.md"
requires-python = ">=3.9"
license = { text = "MIT" }
dependencies = [
    "requests>=2.28",
]

[project.urls]
Homepage = "https://github.com/yourname/my-package"
```

#### 发布流程

```bash
# 1. 安装工具（推荐 uv，速度更快）
pip install uv

# 2. 构建（生成 dist/*.whl 和 dist/*.tar.gz）
uv build

# 3. 先发到测试环境验证
uv publish --index testpypi

# 4. 正式发布到 PyPI
uv publish
```

#### 认证配置（`~/.pypirc`）

```ini
[pypi]
username = __token__
password = pypi-xxxxxx...   # 在 pypi.org 账号设置中生成 API Token
```

#### 版本更新

```bash
# 修改 pyproject.toml 中的 version 字段
# 重新 build → publish
git tag v0.2.0 && git push origin v0.2.0
```

**发布后用户安装：**
```bash
pip install my-package
# 或
uv add my-package
```

---

### 5.2 Go 包发布（Go Module）

Go 发包**极简**，不需要注册平台，直接用 Git 仓库即可，`pkg.go.dev` 自动索引。

#### 初始化模块

```bash
# module 路径必须和仓库地址完全一致
go mod init github.com/yourname/my-package
```

#### 代码结构

```
my-package/
├── go.mod
├── go.sum
├── mypackage.go          # 公开 API 用大写字母开头
├── mypackage_test.go
└── README.md
```

```go
// mypackage.go
package mypackage

// Hello 公开函数（大写开头）
func Hello() string {
    return "hello"
}
```

#### 发布流程（打 Tag 即发布）

```bash
git add .
git commit -m "feat: initial release"
git tag v1.0.0
git push origin main --tags
# 推送后 pkg.go.dev 会自动索引，无需任何额外操作
```

**发布后用户安装：**
```bash
go get github.com/yourname/my-package@v1.0.0
```

#### 版本规范（严格遵守 SemVer）

| Tag | 含义 |
|-----|------|
| `v1.0.0` | 正式版 |
| `v1.1.0` | 新功能（向后兼容） |
| `v1.1.1` | Bug 修复 |
| `v2.0.0` | 破坏性变更（⚠️ 需同步修改 go.mod 路径为 `.../v2`） |

> **v2+ 特殊规则：** Go 规定 v2 及以上需要在 module 路径末尾加 `/v2`：
> ```
> module github.com/yourname/my-package/v2
> ```
> 用户引用时：`go get github.com/yourname/my-package/v2@v2.0.0`

#### 强制触发 pkg.go.dev 索引

```bash
# 如果自动索引较慢，可以手动触发
curl https://proxy.golang.org/github.com/yourname/my-package/@v/v1.0.0.info
```

---

### 5.3 发布对比总结

| 维度 | Python (PyPI) | Go (Go Module) |
|------|--------------|----------------|
| 注册账号 | 需要注册 pypi.org | 不需要，用 Git 仓库 |
| 发布命令 | `uv publish` | `git tag + push` |
| 索引平台 | pypi.org | pkg.go.dev（自动） |
| 版本管理 | `pyproject.toml` 中修改 | Git Tag |
| 私有包 | 私有 PyPI 服务器 / Artifactory | `GONOSUMCHECK` + 私有仓库 |
| 安装命令 | `pip install` / `uv add` | `go get` |

---

## 六、知识库组织结构

```
知识库/
├── 方法论/                    # How to think
│   ├── 项目启动-Checklist.md
│   ├── 技术选型-决策框架.md
│   ├── 估时方法论.md
│   └── 复盘模板.md
│
├── 技术栈/                    # What to use & how
│   ├── 前端/
│   │   ├── React-最佳实践.md
│   │   ├── TypeScript-常用模式.md
│   │   └── 性能优化手册.md
│   ├── 后端/
│   │   ├── API-设计规范.md
│   │   └── 数据库-设计原则.md
│   └── 基础设施/
│       ├── Docker-常用配置.md
│       ├── GitHub-Actions-模板.md
│       └── Nginx-配置参考.md
│
├── 项目模板/                  # How to start fast
│   ├── web-frontend/
│   ├── fullstack-nextjs/
│   └── api-hono/
│
├── 最佳实践/                  # How to do well
│   ├── Git-工作流.md
│   ├── 代码审查-指南.md
│   ├── 安全-实践清单.md
│   └── 测试-策略.md
│
└── 案例归档/                  # What I've done & learned
    ├── YYYY-项目名/
    │   ├── 技术方案.md
    │   ├── 踩坑记录.md
    │   └── 复盘.md
    └── ...
```

---

## 七、常用 Checklist

### 项目启动 Checklist

- [ ] 明确项目目标和成功指标
- [ ] 竞品调研完成
- [ ] 技术选型确定并有文档记录
- [ ] 仓库初始化（.gitignore、README、License）
- [ ] 代码规范配置（ESLint、Prettier、EditorConfig）
- [ ] 提交规范配置（commitlint、husky）
- [ ] 环境变量模板（`.env.example`）
- [ ] CI 基础流水线（lint + test）

### 上线前 Checklist

- [ ] 所有测试通过
- [ ] 性能指标达标（Lighthouse ≥ 90）
- [ ] 安全扫描无高危漏洞
- [ ] 错误监控已接入（Sentry）
- [ ] 监控告警已配置
- [ ] 数据库已备份
- [ ] 回滚方案已准备
- [ ] 文档已更新

### 复盘模板

```markdown
## 项目复盘 - [项目名] [日期]

### 做得好的地方
-

### 遇到的问题
-

### 解决方案
-

### 下次改进点
-

### 可沉淀的模板/工具
-
```

---

## 参考资源

- [The Twelve-Factor App](https://12factor.net/zh_cn/) - 现代应用构建原则
- [Web.dev](https://web.dev/) - Google 前端性能与最佳实践
- [OWASP Top 10](https://owasp.org/www-project-top-ten/) - Web 安全十大风险
- [Conventional Commits](https://www.conventionalcommits.org/zh-hans/) - 提交规范
- [semver.org](https://semver.org/lang/zh-CN/) - 语义化版本规范

---

*持续更新中 — 每完成一个项目后补充案例归档与复盘。*
