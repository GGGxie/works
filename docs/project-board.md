# 项目看板（GitHub Project）

看板：<https://github.com/users/GGGxie/projects/2>（私有）。目的：一眼看清 12 个项目各自的状态，以及哪些事需要维护者处理。

## 数据归属

| 内容 | 事实来源 | 看板怎么用 |
|---|---|---|
| 项目的生命周期、优先级 | 飞书「个人项目总览」 | 同步到项目卡片（只读飞书） |
| 任务与风险 | 各仓库的 GitHub issue | 作为条目加入看板，状态随 issue 自动更新 |
| 项目卡片的 Status | 由规则推导，不手工维护 | 见下表 |

项目卡片的 Status 规则（`scripts/board/lib/board-rules.mjs`，有测试）：

| Status | 含义 |
|---|---|
| Todo | 有未关闭的「风险」或「任务」issue——需要维护者处理或决定 |
| In Progress | 生命周期为「开发中」，且没有待办 |
| Done | 稳定，没有待办（运行中 / 暂停 / 归档且无待办） |

> 「Done」不表示"已完成"，表示"没有需要你处理的事"。

## 字段

字段名用英文，因为 `gh` 的 JSON 输出会把中文字段名的首字符弄成乱码，脚本无法稳定读取。选项值可以是中文。

`Project`（12 个项目）· `Kind`（项目 / 任务 / 风险）· `Priority`（P1–P3）· `Lifecycle`（运行中 / 开发中 / 暂停 / 归档）· `Status`（Todo / In Progress / Done）

## 视图

| 视图 | 布局 | 过滤 | 用途 |
|---|---|---|---|
| 看板（按状态） | Board，按 Status 分列 | `kind:项目` | 12 张项目卡，一眼看谁需要关注 |
| 需要我处理 | Table | `kind:风险,任务 -status:Done` | 所有未完成的风险与任务 |
| 全部项目 | Table | `kind:项目` | 带优先级、生命周期的项目列表 |
| 全部条目 | Table | 无 | 兜底 |

GitHub 的公开 API 只允许设置视图的布局、过滤和可见字段，**不能设置分组与排序**。如果想要「按 Project 分组」或「按 Priority 排序」，在网页上点一下即可。

内置工作流已开启：issue 关闭自动变 Done、PR 合并自动更新等。

## 同步

```bash
node scripts/board/sync-board.mjs --dry-run   # 只显示会改什么
node scripts/board/sync-board.mjs             # 实际写入
```

做的事：把各仓库新的 open issue 加入看板并分类（标题或标签含 `riskKeywords` 中的词 → 风险，其余 → 任务）；按飞书更新项目卡片的 Lifecycle / Priority；按待办数推导 Status。已经一致的字段不写，重复运行结果相同。

需要：`gh` 已登录且有 `project` 权限；`feishu-cli` 已登录；飞书 Base 的 token 与表 ID 取自被 git 忽略的 `public/config/private.json`。

`scripts/board/board.config.json` 里的 `ignoreIssues` 放不应进看板的 issue（组合总览 `works#1`、HAP 的项目占位 `HAP#10`）。

## 新增项目

1. 飞书表里加一行
2. 看板 `Project` 字段里加一个选项（网页 Settings 或 `gh project field-create`）
3. `board.config.json` 的 `repos` 与 `projectNames` 里补上
4. 手动在看板加一张项目卡片（`Kind=项目`），之后同步脚本会维护它

## 定时同步
cron 每天 09:15 运行一次同步（幂等），输出追加到 `/root/.cache/board-sync.log`：

```
15 9 * * * cd /root/Document/works && /usr/local/bin/node scripts/board/sync-board.mjs >> /root/.cache/board-sync.log 2>&1
```

- 依赖 `gh` 已登录、`feishu-cli` 的 user token 有效（过期后同步会失败，日志里能看到；重新登录飞书即可恢复）
- 工作树必须保持在 `codex/project-control`（探活脚本也依赖它）
- 想立刻刷新：`node scripts/board/sync-board.mjs`；只看会改什么：加 `--dry-run`
- 停用：`crontab -e` 删掉这一行（修改前的备份在 `/root/.cache/crontab.bak.*`）
