FROM oven/bun:latest

# Set up workspace context
WORKDIR /workspace

# Copy workspace configuration files
COPY ./package.json ./bun.lock ./

# Copy the shared package
COPY ./packages/shared ./packages/shared

# Set up API directory and copy API package.json
WORKDIR /workspace/apps/api
COPY ./apps/api/package.json ./

# Install dependencies from workspace root
WORKDIR /workspace
RUN bun install

# Copy API source code
WORKDIR /workspace/apps/api
COPY ./apps/api/ ./

# Build the API
RUN bun run build

EXPOSE 8000

CMD ["bun", "dist/index.js"]