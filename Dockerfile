ARG NODE_VERSION=22.21.0-slim
FROM node:${NODE_VERSION} as base

ENV USER=HarmoniQ

RUN apt-get update && \
    apt-get install -y --no-install-recommends \
      python3 \
      build-essential \
      libopus-dev \
    && rm -rf /var/lib/apt/lists/*


RUN groupadd -r ${USER} && \
    useradd --create-home --home /home/HarmoniQ -r -g ${USER} ${USER}


USER ${USER}
WORKDIR /home/HarmoniQ


FROM base as build

ENV USER=HarmoniQ

COPY --chown=${USER}:${USER} . .
RUN npm ci
RUN npm run build

RUN rm -rf node_modules && \
    npm ci --omit=dev


    
FROM node:${NODE_VERSION} as prod

ENV USER=HarmoniQ

COPY --chown=${USER}:${USER} package*.json ./
COPY --from=build --chown=${USER}:${USER} /home/HarmoniQ/node_modules ./node_modules
COPY --from=build --chown=${USER}:${USER} /home/HarmoniQ/dist ./dist

CMD [ "node" , "./dist/index.js"]