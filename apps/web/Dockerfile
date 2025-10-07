FROM oven/bun:latest

ARG NEXT_PUBLIC_APP_API_URL
ARG NEXT_PUBLIC_APP_API_KEY
ARG NEXT_PUBLIC_PINATA_JWT_TOKEN
ARG NEXT_PUBLIC_WEB3AUTH_CLIENT_ID

ENV NEXT_PUBLIC_APP_API_URL=$NEXT_PUBLIC_APP_API_URL
ENV NEXT_PUBLIC_APP_API_KEY=$NEXT_PUBLIC_APP_API_KEY
ENV NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=$NEXT_PUBLIC_WEB3AUTH_CLIENT_ID
ENV NEXT_PUBLIC_PINATA_JWT_TOKEN=$NEXT_PUBLIC_PINATA_JWT_TOKEN

WORKDIR /workspace

COPY ./package.json ./bun.lock ./

COPY ./packages/shared ./packages/shared
COPY ./packages/smart-contracts ./packages/smart-contracts
COPY ./apps/web/package.json ./apps/web/package.json
COPY ./apps/api/package.json ./apps/api/package.json

WORKDIR /workspace
RUN bun install

WORKDIR /workspace/apps/web
COPY ./apps/web/ ./

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]