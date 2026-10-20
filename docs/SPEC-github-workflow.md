# Spec: github-workflow

## Objective

Use GitHub as the authoritative source for repositories, Issues, PRs, and code state while creating one lightweight portfolio coordination issue in `GGGxie/works` that links the active project set and the Feishu portfolio.

## Tech Stack

- Connected GitHub plugin
- GitHub repository, Issue, and PR APIs exposed by the plugin
- Local inventory produced by `inventory-catalog`

## Commands

- Read verification: list repositories for owner `GGGxie`
- Write verification: create one issue in `GGGxie/works`
- No shell GitHub credentials are required

## Project Structure

- GitHub repositories remain independent.
- `GGGxie/works` contains the single portfolio coordination issue.
- Feishu stores the issue URL and per-project repository URLs.

## Code Style

```markdown
## Active projects

- [ ] HAP — repository / Feishu record / public URL
```

Keep the issue navigational and project-level. Detailed development tasks stay in each repository's own Issues.

## Testing Strategy

- Confirm every linked repository is accessible through the connected plugin.
- Create exactly one coordination issue and read it back.
- Do not create duplicate coordination issues on reruns; search before create.

## Boundaries

- Always: GitHub remains source of truth for code work.
- Always: use local/GitHub-matched active projects first.
- Ask first: archive repositories, change visibility, or create bulk Issues.
- Never: close, delete, relabel, or reassign existing user Issues.
- Never: create one mirrored Issue per Feishu record.

## Success Criteria

- Active project repositories are reconciled with local folders.
- One idempotent portfolio coordination issue exists in `GGGxie/works`.
- The issue links the Feishu Base after it is created.
- No existing repository settings or Issues are changed.

## Open Questions

- GitHub Projects v2 creation is excluded because the connected plugin does not expose Projects mutations.
