# Backend: Express + Prisma 7 (pg driver adapter)
FROM node:20-slim

WORKDIR /app

# Prisma's query engine needs openssl present at runtime.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
  && rm -rf /var/lib/apt/lists/*

# Install deps first (better layer caching)
COPY package*.json ./
RUN npm ci

# Build: `npm run docker-build` == `prisma generate && tsc`
COPY . .
RUN npm run docker-build

ENV NODE_ENV=production
ENV PORT=8000
EXPOSE 8000

CMD ["node", "dist/index.js"]
