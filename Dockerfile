# Use Node.js 24 with pnpm via Corepack
FROM node:24-alpine

# Configure pnpm from packageManager field
ENV PNPM_HOME="/pnpm" \
    PATH="$PNPM_HOME:$PATH"

WORKDIR /app

# Install dependencies first for better caching
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate \
    && pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Default command; override in docker-compose if needed
CMD ["pnpm", "exec", "tsx", "src/http/server.ts"]
