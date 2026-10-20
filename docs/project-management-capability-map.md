# Capability Map: Personal Project Control Plane

## Goal

建立一套覆盖 `/root/Document/` 本地项目、GitHub 开发活动、飞书项目总览和 works 聚合视图的个人项目管理系统，同时避免在三个平台重复维护同一份状态。

## Source-of-truth boundaries

| Information | Source of truth | Consumers |
|---|---|---|
| Repository, Issue, PR, code status | GitHub | Plane, Feishu summary, works |
| Project catalog, priority, lifecycle, decisions | Feishu Base / Docs | works |
| Local path, manifests, deployment discovery | Local inventory | Feishu, works |
| Public portfolio and service overview | works (read-only projection) | Browser |

Feishu stores project-level summaries only。它不镜像每一个 GitHub Issue，也不成为第二套任务跟踪器。

## Modules

| Module id | Responsibility | Depends on |
|---|---|---|
| `inventory-catalog` | Discover top-level projects under `/root/Document/`, inspect Git metadata/manifests, and reconcile local folders with GitHub repositories and the existing works catalog. | — |
| `github-workflow` | Define repository inclusion and Issue conventions, then publish one portfolio coordination issue in `GGGxie/works`. GitHub remains the code-work source of truth. | `inventory-catalog` |
| `feishu-portfolio` | Create a user-editable Base with one record per project, lifecycle/priority/runtime fields, and focused grid/kanban views. | `inventory-catalog` |
| `works-projection` | Generate a read-only aggregate for works from the local catalog, GitHub metadata, Feishu links, and runtime sources without turning works into an orchestration platform. | `feishu-portfolio`, `github-workflow` |

Build order:

`inventory-catalog` → (`github-workflow` + `feishu-portfolio`) → `works-projection`

## Current audit

- Local root contains 13 top-level directories; 9 are Git repositories.
- The connected GitHub account exposes 24 repositories owned by `GGGxie`; repository metadata reports admin/push access.
- The GitHub connector can manage repositories, Issues, and PRs, but does not expose GitHub Projects v2 mutations. Plane will therefore use GitHub Issues directly; a GitHub Project board is optional and requires a separate authenticated GraphQL/CLI path.
- `feishu-cli` v1.37.1 exists at `/root/go/bin/feishu-cli` but is not on `PATH`.
- Feishu App credentials are valid and OpenAPI is reachable. No user OAuth session exists, so a Base created now would be app-owned rather than user-owned; user login with Base write scopes is required before creating the editable portfolio.
- Docker 29.6.1 and Compose v5.3.1 are available and the daemon is writable, but runtime migration is outside this phase.

## Decisions requiring confirmation

1. Feishu ownership: authorize the CLI with user OAuth and Base write scopes so the created Base belongs to and is editable by the user.
2. GitHub scope: manage the active local/GitHub-matched projects first; older remote-only repositories remain cataloged as archived/unclassified until reviewed.

## Explicitly not doing

- Copying every GitHub Issue into Feishu.
- Treating every folder under `/root/Document/` as an active public project without review.
- Modifying or committing the user's existing uncommitted changes in `public/config/projects.json` and `public/images/projects/writing-agent.png`.
- Storing Feishu, GitHub, or Plane secrets in the works repository.
