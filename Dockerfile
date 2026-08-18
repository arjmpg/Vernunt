FROM node:20-slim AS builder

WORKDIR /app

# Copy package files
COPY package.json ./

# Install dependencies including devDependencies for build step
RUN npm install --no-audit --no-fund

# Copy source code
COPY . .

# Build frontend and bundled server
RUN npm run build

# Production image
FROM node:20-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Copy package files and install production dependencies only
COPY package.json ./
RUN npm install --omit=dev --no-audit --no-fund

# Copy build artifacts from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/scripts ./scripts
COPY --from=builder /app/index.html ./index.html
COPY --from=builder /app/firebase-blueprint.json ./firebase-blueprint.json
COPY --from=builder /app/firestore.rules ./firestore.rules

EXPOSE 3000

CMD ["node", "dist/server.cjs"]
