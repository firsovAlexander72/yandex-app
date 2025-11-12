# ---- Builder ----
FROM node:20-alpine AS builder
WORKDIR /app
ENV NODE_ENV=production
# Enable corepack (pnpm)
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

# ---- Runner ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000
# Enable pnpm
RUN corepack enable
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --prod --frozen-lockfile
# Copy build output
COPY --from=builder /app/dist ./dist
EXPOSE 3000
CMD ["node","dist/server/node-build.mjs"]
