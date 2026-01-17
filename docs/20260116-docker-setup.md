# Docker setup added

Date: 2026-01-16

## Added
- `Dockerfile` for running the Next.js app in a container
- `docker-compose.yml` to run the app and a local Postgres instance together
- `.dockerignore` to keep image builds fast and clean
- OpenSSL install step in `Dockerfile` to satisfy Prisma in containers

## Updated
- `README.md` with Docker quickstart instructions and seed command

## Notes
- Compose uses a default `SESSION_SECRET` placeholder; replace it for real use.
- The app container runs `pnpm db:generate` and `prisma db push` on startup.
- Compose sets `PRISMA_CLIENT_ENGINE_TYPE=library` to keep Prisma on the Node.js engine.
- The Docker image also sets `PRISMA_CLIENT_ENGINE_TYPE=library` as a safety net.

