# Spec: works-projection

## Objective

Extend the private `/lab` view into a read-only project control panel that shows discovered projects, GitHub matching, public portfolio inclusion, runtime state, and the Feishu portfolio link without becoming a deployment or task-management system.

## Tech Stack

- React 19.2, TypeScript 5.9, Vite 7.2
- Existing static prerender and private `/lab` access gate
- Existing `private.json` and `health.json` feeds

## Commands

- Develop: `npm run dev`
- Inventory: `npm run inventory:check && npm run inventory`
- Lint: `npm run lint`
- Build: `npm run build`

## Project Structure

- `src/pages/Lab.tsx` / `Lab.css` — private inventory UI
- `src/types/index.ts` — inventory types
- `scripts/inventory-projects.mjs` — generated inventory
- `public/config/private.json` — gated private feed
- `README.md` — operating instructions

## Code Style

```tsx
function ProjectState({ state }: { state: ProjectInventoryState }) {
  return <span className={`project-state project-state-${state}`}>{state}</span>;
}
```

Follow existing functional-component patterns, semantic HTML, explicit TypeScript contracts, and existing CSS variables.

## Testing Strategy

- Type-check through the production build.
- Run ESLint.
- Verify `/lab` with generated inventory and with inventory absent.
- Confirm public pages and prerendered project routes remain unchanged.
- Confirm local paths appear only in the gated `/lab` response.

## Boundaries

- Always: keep `/lab` read-only.
- Always: degrade gracefully when GitHub, Feishu, or health data is unavailable.
- Always: preserve the existing public portfolio behavior.
- Ask first: add start/stop/redeploy buttons or server-side command execution.
- Never: expose tokens, private repository details, or local paths on public routes.
- Never: modify the user's current uncommitted project entry and image.

## Success Criteria

- `/lab` shows counts for discovered, GitHub-matched, public, running, and unclassified projects.
- Each project row shows available local, GitHub, public URL, and lifecycle metadata.
- A visible link opens the Feishu portfolio for authorized users.
- Existing health status remains available.
- `npm run lint` and `npm run build` pass.

## Open Questions

- None; write controls and deployment operations are explicitly out of scope.
