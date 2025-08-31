FROM oven/bun:latest

WORKDIR /api

COPY package.json ./

RUN bun install

COPY . ./

RUN bun run build

EXPOSE 8000

CMD ["bun", "start"]