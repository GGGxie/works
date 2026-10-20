# Spec: feishu-portfolio

## Objective

Create a user-owned Feishu Base named `个人项目总览` with one record per reconciled project, project-level lifecycle metadata, and views for active work, runtime status, and items needing classification.

## Tech Stack

- `/root/go/bin/feishu-cli` v1.37.1
- Feishu Base v3 API through authenticated user identity
- Local inventory and GitHub repository metadata

## Commands

- Permission check: `/root/go/bin/feishu-cli auth check --scope "base:app base:table base:record base:field base:view"`
- Create Base: `/root/go/bin/feishu-cli bitable create --name "个人项目总览" --time-zone Asia/Shanghai --as user`
- Verify tables, fields, records, and views with the corresponding `bitable ... list/get` commands.

## Project Structure

- Table `项目` — one record per project
- Required fields: 项目名称, 项目ID, 生命周期, 优先级, 分类状态, 本地路径, GitHub, 线上地址, 技术栈, 当前分支, Git状态, Works状态, 下一步行动, 最后同步时间
- Views: 全部项目, 活跃项目, 运行状态, 待分类
- Base token and table/view IDs are stored only in local ignored configuration, never committed.

## Code Style

```json
{
  "项目名称": "HAP",
  "项目ID": "hap",
  "生命周期": "运行中",
  "分类状态": "已匹配"
}
```

Use stable project IDs, exact select-option names, and batch writes of at most 200 records.

## Testing Strategy

- Run scope check before every write phase.
- Create schema before records and read fields back.
- Insert a small sample first, read it back, then batch-create the remainder.
- Verify record count and unique 项目ID values.
- Verify all views can be listed after creation.

## Boundaries

- Always: use user OAuth so the Base is user-owned and editable.
- Always: use Feishu only for project-level portfolio data.
- Ask first: add collaborators or public sharing.
- Never: store credentials, tokens, `.env` values, or private Issue bodies.
- Never: delete or modify unrelated Feishu files/Bases.

## Success Criteria

- User OAuth includes all required Base write scopes.
- A user-owned `个人项目总览` Base exists with the required schema and views.
- Every local project has exactly one record; uncertain items are marked `待分类`.
- GitHub and public URLs are populated only when verified.
- The Base URL is linked from GitHub and works `/lab`.

## Open Questions

- None; the OAuth authorization step is required before implementation.
