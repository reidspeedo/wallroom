# Docker CMD uses debug start script

Date: 2026-01-17

## Updated
- `Dockerfile` now runs `scripts/docker-start.js` so startup is consistent even if compose overrides are ignored.

## Notes
- This keeps the debug instrumentation active for verification.

