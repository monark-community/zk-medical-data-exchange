FROM oven/bun:latest

WORKDIR /workspace

COPY ./package.json ./bun.lock ./

COPY ./packages/shared ./packages/shared
COPY ./packages/smart-contracts ./packages/smart-contracts
COPY ./apps/web/package.json ./apps/web/package.json
COPY ./apps/api/package.json ./apps/api/package.json

WORKDIR /workspace
RUN bun install

WORKDIR /workspace/apps/api
COPY ./apps/api/ ./


EXPOSE 8000

CMD ["bun", "run", "src/index.ts"]