FROM oven/bun:latest

WORKDIR /web

COPY package.json ./

RUN bun install

COPY . ./

RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]