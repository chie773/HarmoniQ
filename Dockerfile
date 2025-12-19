ARG NODE_VERSION=22.21.0-slim
FROM node:${NODE_VERSION}

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      build-essential \
      libopus-dev \
    && rm -rf /var/lib/apt/lists/*

COPY  . . 

RUN npm install 
RUN npm run build

RUN npm prune --production

CMD [ "node" , "./dist/index.js"]