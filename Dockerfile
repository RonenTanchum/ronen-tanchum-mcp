FROM node:20-alpine

WORKDIR /app

# Copy source and config
COPY package*.json ./
COPY tsconfig.json ./
COPY src/ ./src/

# Install all deps (including dev for TypeScript compiler)
RUN npm ci

# Compile TypeScript → dist/
RUN npm run build

# Drop dev dependencies
RUN npm prune --omit=dev

ENV PORT=3000
EXPOSE 3000

CMD ["node", "dist/index.js"]
