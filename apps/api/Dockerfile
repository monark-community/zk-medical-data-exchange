FROM oven/bun:latest

# Set up workspace context
WORKDIR /workspace

# Copy workspace configuration files
COPY ./package.json ./bun.lock ./

# Copy all workspace directories that are referenced in package.json
COPY ./packages/shared ./packages/shared
COPY ./packages/smart-contracts ./packages/smart-contracts
COPY ./apps/web/package.json ./apps/web/package.json
COPY ./apps/api/package.json ./apps/api/package.json

# Install dependencies from workspace root
WORKDIR /workspace
RUN bun install

# Copy API source code
WORKDIR /workspace/apps/api
COPY ./apps/api/ ./

# Don't build - Bun can run TypeScript directly
# RUN bun run build

EXPOSE 8000

# Run TypeScript directly with Bun
CMD ["bun", "run", "src/index.ts"]