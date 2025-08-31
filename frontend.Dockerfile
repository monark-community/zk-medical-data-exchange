# Use official Bun image for frontend build
FROM oven/bun:latest

WORKDIR /app

# Copy package files and install dependencies
COPY demo/package.json demo/bun.lockb ./
RUN bun install

# Copy frontend source code
COPY demo .

# Build the frontend (adjust if your build script is different)
RUN bun run build

# Expose the port (default for Vite/Next is 3000, change if needed)
EXPOSE 3000

# Start the frontend (adjust if your start script is different)
CMD ["bun", "run", "start"]
