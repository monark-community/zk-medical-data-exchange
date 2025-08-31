FROM oven/bun:latest

WORKDIR /api

COPY apps/api/package.json ./
COPY bun.lock ./

RUN bun install

COPY apps/api/ ./

RUN bun run build

EXPOSE 8000

CMD ["bun", "start"]