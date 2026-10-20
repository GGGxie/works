# GitHub + Feishu + works Tasks

## Task 1: Authorize Feishu Base access

**Description:** Complete user OAuth for the exact Base scopes and prove the selected identity can perform user-owned Base operations.

**Acceptance criteria:**
- [x] User token is healthy and refreshable.
- [x] `base:app base:table base:record base:field base:view` scope check passes.
- [x] No token or device code is written to repository files.

**Verification:**
- [x] `/root/go/bin/feishu-cli auth status -o json --verify`
- [x] `/root/go/bin/feishu-cli auth check --scope "base:app base:table base:record base:field base:view"`

**Dependencies:** None

**Files likely touched:** None

**Estimated scope:** XS

## Task 2: Generate the private project inventory

**Description:** Add a deterministic scanner that reconciles top-level local folders, Git metadata, GitHub repository metadata, and works entries while preserving manual private configuration.

**Acceptance criteria:**
- [x] Every top-level folder is represented or ignored with a reason.
- [x] Matching and classification are deterministic; duplicate IDs fail validation.
- [x] Existing `notes`, `offline`, and `ops` survive generation unchanged.

**Verification:**
- [x] `node --test tests/project-inventory.test.mjs`
- [x] `npm run inventory:check`
- [x] Run generation twice and confirm the second run has no diff.

**Dependencies:** None

**Files likely touched:**
- `scripts/lib/project-inventory.mjs`
- `scripts/inventory-projects.mjs`
- `tests/project-inventory.test.mjs`
- `package.json`

**Estimated scope:** M

## Checkpoint: Inventory foundation

- [x] Task 1 scope verification passes.
- [x] Task 2 tests and check mode pass.
- [x] Generated inventory is reviewed before external import.

## Task 3: Create the Feishu project portfolio

**Description:** Create the user-owned `个人项目总览` Base, add the approved schema and views, validate a small sample, then import all discovered projects.

**Acceptance criteria:**
- [x] Required fields and select options exist and read back correctly.
- [x] Every discovered project has exactly one record keyed by 项目ID.
- [x] Views `全部项目`, `活跃项目`, `运行状态`, and `待分类` exist.

**Verification:**
- [x] List and read back tables, fields, records, and views using `--as user`.
- [x] Record count matches unique inventory project count.
- [x] Base URL opens for the authenticated user.

**Dependencies:** Tasks 1 and 2

**Files likely touched:**
- `public/config/private.json` (ignored local data only)

**Estimated scope:** M

## Task 4: Create the GitHub coordination issue

**Description:** Search for the exact portfolio issue title in `GGGxie/works`, create it only if absent, and cross-link the Feishu Base and active repositories.

**Acceptance criteria:**
- [x] Exactly one open coordination issue exists.
- [x] It links the verified repository set and Feishu Base.
- [x] No existing Issue metadata is modified.

**Verification:**
- [x] Read the resulting issue through the GitHub connector.
- [x] Re-run the search and confirm no duplicate would be created.

**Dependencies:** Task 3

**Files likely touched:** None

**Estimated scope:** S

## Checkpoint: External surfaces

- [x] Feishu schema, records, and views are verified.
- [x] GitHub issue and Feishu Base cross-link each other where supported.

## Task 5: Render project reconciliation in `/lab`

**Description:** Extend private types and the Lab page to show inventory counts, reconciliation state, repository/public links, lifecycle metadata, and the Feishu portfolio link.

**Acceptance criteria:**
- [x] Counts cover discovered, GitHub-matched, public, running, and unclassified projects.
- [x] Missing inventory or portfolio data degrades gracefully.
- [x] Existing service health rows remain functional.

**Verification:**
- [x] `npm run lint`
- [x] `npm run build`
- [x] Component output manually checked with complete and absent optional data.

**Dependencies:** Tasks 2, 3, and 4

**Files likely touched:**
- `src/types/index.ts`
- `src/pages/Lab.tsx`
- `src/pages/Lab.css`

**Estimated scope:** M

## Task 6: Document the operating workflow

**Description:** Document how discovery, Feishu curation, GitHub work, and works projection fit together and how to rerun inventory safely.

**Acceptance criteria:**
- [ ] README identifies each source of truth.
- [ ] Commands for check, generate, lint, and build are documented.
- [ ] Privacy and access-gate behavior is explicit.

**Verification:**
- [ ] Every documented command exists in `package.json`.
- [ ] `git diff --check` passes.

**Dependencies:** Tasks 2 and 5

**Files likely touched:**
- `README.md`

**Estimated scope:** S

## Task 7: Complete end-to-end verification

**Description:** Verify the final integration locally and in a real browser without altering public portfolio behavior.

**Acceptance criteria:**
- [ ] Inventory tests, lint, and production build pass.
- [ ] `/lab` displays the project control panel and existing service health.
- [ ] Home, About, and one project detail page remain unchanged and error-free.

**Verification:**
- [ ] `node --test tests/project-inventory.test.mjs`
- [ ] `npm run inventory:check && npm run lint && npm run build`
- [ ] Browser console and network checks show no new errors.

**Dependencies:** Tasks 1–6

**Files likely touched:** None

**Estimated scope:** S

## Checkpoint: Complete

- [ ] All task acceptance criteria pass.
- [ ] No secrets are present in tracked changes.
- [ ] Pre-existing user changes are not staged or modified.
- [ ] Ready for user review.
