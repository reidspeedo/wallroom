# Prisma runtime debug logs

Date: 2026-01-17

## Added
- Debug instrumentation in `lib/prisma.ts` to log Prisma client initialization details and failures.

## Notes
- Logs are temporary and will be removed after verification.
- Prisma generate now forces `PRISMA_CLIENT_ENGINE_TYPE=library` in Docker.
- Docker startup script defaults `PRISMA_CLIENT_ENGINE_TYPE=library` if missing.

