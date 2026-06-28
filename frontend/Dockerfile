# Frontend: Next.js 16 (production server)
FROM node:20-slim

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# NEXT_PUBLIC_* is baked into the client bundle at build time. This is the
# origin the BROWSER uses — it points at nginx, which proxies /api to the
# backend. Override with --build-arg if you serve the cell on another host.
ARG NEXT_PUBLIC_API_URL=http://localhost:8090
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start"]
