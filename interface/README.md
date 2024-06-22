# 6022 Protocol Interface

## 0. Install dependencies

To use the project you must install hardhat package:

```bash
yarn install
```

## 1. Get a Wallet Connect Project Id

1. Go to : https://cloud.walletconnect.com/sign-in
2. Create a account
3. Create a project
4. Get the project id

## 2. Run

```bash
yarn dev
```

## 3. Run with Docker

Build the image with mainnet variables :

```
docker build --build-arg VITE_CONTROLLER_SMART_CONTRACT_ADDRESS=0xE331f6f03DDD89Fc5a1C3f06c2b4631a9242c038 \
--build-arg VITE_REWARD_POOL_FACTORY_SMART_CONTRACT_ADDRESS=0x37cfB1E7990860b23D5350C759dC1e75fc1794A4 \
--build-arg VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS=0xD7D5562c3d3Ad763276f634caEF8878F0dc920ED \
--build-arg VITE_WALLET_CONNECT_PROJECT_ID=<WALLET_CONNECT_PROJECT_ID> \
--build-arg VITE_SCANNER_BASE_URL=https://polygonscan.com \
-t 6022-interface .
```

Build the image with testnet variables :

```
docker build --build-arg VITE_CONTROLLER_SMART_CONTRACT_ADDRESS=0x349f760fe5C407829e931B3d53D1e2a5f4C69848 \
--build-arg VITE_REWARD_POOL_FACTORY_SMART_CONTRACT_ADDRESS=0xBb87A8D37148dB6cB2B13127666c6203E230F24b \
--build-arg VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS=0xA5C53f4b487d31644792ac73263860B445e80C74 \
--build-arg VITE_WALLET_CONNECT_PROJECT_ID=<WALLET_CONNECT_PROJECT_ID> \
--build-arg VITE_SCANNER_BASE_URL=https://amoy.polygonscan.com \
-t 6022-interface .
```
