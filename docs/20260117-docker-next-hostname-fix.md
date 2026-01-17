# Docker Next dev hostname fix

Date: 2026-01-17

## Updated
- `scripts/docker-start.js` now runs `next dev` via `pnpm exec` to avoid passing a `--` separator that Next treats as a project directory.

## Notes
- This keeps the one-command Docker startup flow non-interactive and ensures the dev server binds correctly.

