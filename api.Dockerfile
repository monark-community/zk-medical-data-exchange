# Use the official Bun image
FROM oven/bun:latest

WORKDIR /app

# Copy package files and install dependencies
COPY package.json bun.lockb ./
COPY api/package.json api/bun.lockb ./api/

RUN bun install

# Copy the rest of your source code
COPY . .

# Build your app (if you have a build step)
RUN bun run build

# Expose the port your app runs on (change if needed)
EXPOSE 8000

# Start your app
CMD ["bun", "start"]