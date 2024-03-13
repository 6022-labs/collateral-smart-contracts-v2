# Use ARG to declare variables that you can pass at build time
FROM node:20.11.1-alpine3.19 AS build

WORKDIR /app

COPY package.json ./

RUN yarn install

# Declare ARGs for your environment variables
ARG VITE_CONTROLLER_SMART_CONTRACT_ADDRESS
ARG VITE_REWARD_POOL_FACTORY_SMART_CONTRACT_ADDRESS
ARG VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS
ARG VITE_WALLET_CONNECT_PROJECT_ID
ARG VITE_SCANNER_BASE_URL


# Create .env file and write the environment variables to it
RUN echo "VITE_CONTROLLER_SMART_CONTRACT_ADDRESS=${VITE_CONTROLLER_SMART_CONTRACT_ADDRESS}" >> .env && \
    echo "VITE_REWARD_POOL_FACTORY_SMART_CONTRACT_ADDRESS=${VITE_REWARD_POOL_FACTORY_SMART_CONTRACT_ADDRESS}" >> .env && \
    echo "VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS=${VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS}" >> .env && \
    echo "VITE_WALLET_CONNECT_PROJECT_ID=${VITE_WALLET_CONNECT_PROJECT_ID}" >> .env \
    echo "VITE_SCANNER_BASE_URL=${VITE_SCANNER_BASE_URL}" >> .env

COPY . .

RUN yarn run build

FROM nginx:1.25.4-alpine3.18

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /var/www/html/

EXPOSE 80

ENTRYPOINT ["nginx","-g","daemon off;"]