FROM oven/bun:latest

ARG NEXT_PUBLIC_APP_API_URL
ARG NEXT_PUBLIC_APP_API_KEY
ARG NEXT_PUBLIC_PINATA_JWT_TOKEN
ARG NEXT_PUBLIC_WEB3AUTH_CLIENT_ID

ENV NEXT_PUBLIC_APP_API_URL=$NEXT_PUBLIC_APP_API_URL
ENV NEXT_PUBLIC_APP_API_KEY=$NEXT_PUBLIC_APP_API_KEY
ENV NEXT_PUBLIC_WEB3AUTH_CLIENT_ID=$NEXT_PUBLIC_WEB3AUTH_CLIENT_ID
ENV NEXT_PUBLIC_PINATA_JWT_TOKEN=$NEXT_PUBLIC_PINATA_JWT_TOKEN

# Set up workspace context
WORKDIR /workspace

# Copy workspace configuration files
COPY package.json bun.lock ./

# Copy the shared package
COPY packages/shared ./packages/shared

# Set up web directory and copy web package.json
WORKDIR /workspace/apps/web
COPY apps/web/package.json ./

# Install dependencies from workspace root
WORKDIR /workspace
RUN bun install

# Copy web source code
WORKDIR /workspace/apps/web
COPY apps/web ./

# Build the web app
RUN bun run build

EXPOSE 3000

CMD ["bun", "run", "start"]