# Move root redirect out of middleware

Date: 2026-01-17

## Updated
- `middleware.ts` no longer imports Prisma or queries the database.
- Added `app/page.tsx` to perform the setup/login redirect on the server.

## Notes
- This avoids Prisma usage in Next.js middleware (edge runtime).
- Debug logs were added to the new page and Prisma client for verification.

