# Docker debug startup logging

Date: 2026-01-17

## Added
- `scripts/docker-start.js` to run Prisma setup and Next dev startup with debug logs

## Updated
- `docker-compose.yml` to use the Docker startup script for debugging

## Notes
- This instrumentation is temporary and will be removed after the startup issue is verified and fixed.
- Debug logs now append to `/Users/reid/Documents/Projects/Code/wallroom/.cursor/debug.log` via a bind mount to `/app/.cursor`.
- The startup script now emits a bootstrap log write attempt to confirm logging works.

