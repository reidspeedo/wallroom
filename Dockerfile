FROM node:20-slim

WORKDIR /app

RUN apt-get update -y && apt-get install -y openssl \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable

ENV PRISMA_CLIENT_ENGINE_TYPE=library

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install

COPY . .

EXPOSE 3000

CMD ["node", "scripts/docker-start.js"]

