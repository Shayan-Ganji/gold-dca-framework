# Build stage
FROM oven/bun:1 AS builder
WORKDIR /app
COPY package.json ./
RUN bun install
RUN grep -rl '\.prefault(' node_modules | xargs -r sed -i 's/\.prefault(/.default(/g' || true
COPY . .
ENV NITRO_PRESET=node-server
RUN bun run build

# Serve stage
FROM node:20-slim
WORKDIR /app
COPY --from=builder /app /app
ENV PORT=80
ENV NODE_ENV=production
EXPOSE 80
CMD ["node", ".output/server/index.mjs"]
