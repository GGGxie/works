# Spec: inventory-catalog

## Objective

Discover projects directly under `/root/Document/`, reconcile them with connected GitHub repositories and the public works catalog, and produce a deterministic private inventory for later Feishu import and `/lab` display.

## Tech Stack

- Node.js ESM using only standard-library modules
- Git CLI for local repository metadata
- Existing `public/config/projects.json` and `public/config/private.json`

## Commands

- Generate: `npm run inventory`
- Validate without writing: `npm run inventory:check`
- Project verification: `npm run lint && npm run build`

## Project Structure

- `scripts/inventory-projects.mjs` — scanner and reconciliation logic
- `public/config/private.json` — existing access-controlled private data, extended with generated project inventory
- `src/types/index.ts` — inventory contracts
- `docs/` — source-of-truth specifications

## Code Style

```js
function normalizeProjectId(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
```

Use small pure functions, explicit field names, deterministic sorting, and no additional runtime dependencies.

## Testing Strategy

- `--check` scans and validates without changing files.
- Fail on duplicate normalized IDs or malformed generated records.
- Run ESLint and the production build after integration.
- Compare discovered folders, Git repositories, GitHub matches, and works entries in a generated summary.

## Boundaries

- Always: preserve manually maintained `notes`, `offline`, and `ops` keys in `private.json`.
- Always: classify uncertain folders as `unclassified`; never silently call them active projects.
- Always: keep local paths and private repository metadata behind the existing `/lab` access gate.
- Ask first: scan roots outside `/root/Document/`.
- Never: read `.env`, credentials, repository file contents, or Git history bodies.
- Never: modify discovered repositories.

## Success Criteria

- Every top-level directory is represented or explicitly ignored with a reason.
- Local Git remotes match connected GitHub repositories where possible.
- Running the generator twice produces no second diff.
- Existing private configuration remains intact.

## Open Questions

- None; ambiguous directories default to `unclassified`.
