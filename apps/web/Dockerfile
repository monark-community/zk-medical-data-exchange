FROM oven/bun:latest

WORKDIR /web

COPY apps/web/package.json ./
COPY bun.lock ./
RUN bun install

COPY apps/web/ ./

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]