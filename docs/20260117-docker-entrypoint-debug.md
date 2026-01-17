# Docker entrypoint debug override

Date: 2026-01-17

## Updated
- `docker-compose.yml` now sets `entrypoint` directly to `node scripts/docker-start.js` to avoid `/bin/sh -c` argument parsing.

## Notes
- This is part of the debug flow and will be removed after verification.

