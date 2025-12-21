ARG NODE_VERSION=22.21.0-slim
FROM node:${NODE_VERSION}

WORKDIR /app

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      build-essential \
      libopus-dev \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci

COPY . .

RUN npm run build

RUN npm prune --omit=dev

CMD ["node", "dist/index.js"]