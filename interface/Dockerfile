# Use ARG to declare variables that you can pass at build time
FROM node:20.12.2 AS build

RUN apt-get update && apt-get install -y python3 python3-pip

WORKDIR /app

COPY package.json ./

RUN yarn install

# Declare ARGs for your environment variables
ARG VITE_CONTROLLER_SMART_CONTRACT_ADDRESS
ARG VITE_REWARD_POOL_FACTORY_SMART_CONTRACT_ADDRESS
ARG VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS
ARG VITE_WALLET_CONNECT_PROJECT_ID
ARG VITE_SCANNER_BASE_URL
ARG VITE_ENVIRONMENT


# Create .env file and write the environment variables to it
RUN echo "VITE_CONTROLLER_SMART_CONTRACT_ADDRESS=${VITE_CONTROLLER_SMART_CONTRACT_ADDRESS}" >> .env && \
    echo "VITE_REWARD_POOL_FACTORY_SMART_CONTRACT_ADDRESS=${VITE_REWARD_POOL_FACTORY_SMART_CONTRACT_ADDRESS}" >> .env && \
    echo "VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS=${VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS}" >> .env && \
    echo "VITE_WALLET_CONNECT_PROJECT_ID=${VITE_WALLET_CONNECT_PROJECT_ID}" >> .env \
    echo "VITE_SCANNER_BASE_URL=${VITE_SCANNER_BASE_URL}" >> .env \
    echo "VITE_ENVIRONMENT=${VITE_ENVIRONMENT}" >> .env

COPY . .

RUN yarn run build

FROM nginx:1.25.4-alpine3.18

COPY ./nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /var/www/html/

EXPOSE 80

ENTRYPOINT ["nginx","-g","daemon off;"]