# Prisma adapter for Postgres

Date: 2026-01-17

## Added
- `@prisma/adapter-pg` and `pg` dependencies for Prisma driver adapter support.

## Updated
- `lib/prisma.ts` now initializes a Pg adapter and passes it to PrismaClient when available.

## Notes
- This resolves the Prisma `engine type "client"` requirement for an adapter.

