# Implementation Plan: GitHub + Feishu + works Project Control

## Overview

Build a private, repeatable inventory of projects under `/root/Document/`, initialize a user-owned Feishu Base as the project-level portfolio, create one GitHub coordination issue in `GGGxie/works`, and extend `/lab` into a read-only reconciliation dashboard. Existing public portfolio behavior and current uncommitted user changes remain untouched.

## Architecture Decisions

- GitHub owns repositories, Issues, PRs, and code status; detailed tasks are not copied into Feishu.
- Feishu owns manually curated project lifecycle, priority, and next action.
- Local discovery owns machine facts such as path, current branch, dirty state, manifests, and Git remote.
- `public/config/private.json` remains the private runtime feed because the existing Nginx gate already protects it. The generator preserves its manual keys.
- `/lab` is read-only. No process-control or deployment actions are added.
- Unknown folders and unmatched repositories are surfaced as `unclassified`, not silently treated as active projects.
- No new npm dependency is required; scanner tests use Node's built-in test runner.

## Dependency Graph

```text
Feishu OAuth ───────────────────────┐
                                    ▼
Local inventory → Feishu Base → GitHub coordination issue
       │                    │               │
       └────────────────────┴───────────────┘
                            ▼
                       works /lab
```

## Task List

Tasks are tracked in `tasks/todo.md`.

### Phase 1: Access and inventory foundation

- Task 1: Authorize Feishu user identity and verify Base write scopes.
- Task 2: Implement deterministic local/GitHub/works inventory generation with focused tests.

### Checkpoint: Inventory foundation

- Feishu user write scopes pass.
- Inventory check is deterministic and existing private configuration is preserved.

### Phase 2: External project surfaces

- Task 3: Create and verify the Feishu `个人项目总览` Base, schema, records, and views.
- Task 4: Create or reuse the idempotent GitHub portfolio coordination issue and cross-link Feishu.

### Checkpoint: External surfaces

- Feishu contains one record per discovered project with unique project IDs.
- GitHub contains exactly one coordination issue linked to Feishu.

### Phase 3: works projection

- Task 5: Extend private data contracts and render inventory/reconciliation in `/lab`.
- Task 6: Add responsive styling and operating documentation.
- Task 7: Run lint, tests, production build, and real-browser verification.

### Checkpoint: Complete

- Public routes remain unchanged.
- `/lab` works with complete, missing, and partially stale data.
- No secrets or local paths are exposed outside the gated endpoint.
- User's pre-existing uncommitted changes remain intact.

## Risks and Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Feishu user OAuth lacks one or more Base scopes | High | Run exact scope check before writes; stop and request only missing scopes. |
| Bot-owned instead of user-owned Base | High | Force `--as user` for creation and verification. |
| Folder names do not match GitHub repositories or works IDs | Medium | Normalize conservatively and mark uncertain matches `unclassified`. |
| Generator overwrites manual private notes | High | Merge only the generated `projects` and `portfolio` keys; tests cover preservation. |
| Duplicate GitHub coordination issue | Medium | Search `GGGxie/works` by exact title before create. |
| Local paths leak publicly | High | Keep inventory inside the existing gated private feed and verify Nginx behavior. |
| Current dirty worktree is accidentally included | High | Stage/commit only newly added project-management files; never stage the existing project JSON/image edits. |

## Open Questions

- None. Unknown project lifecycle and priority values will be initialized as `待分类` for later curation in Feishu.
