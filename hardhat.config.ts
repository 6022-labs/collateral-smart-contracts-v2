import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

import "dotenv/config";

import "./tasks/add-factory";
import "./tasks/check-supply";
import "./tasks/create-wallet";
import "./tasks/give-ownership";
import "./tasks/impersonate-test";

const privateKey = process?.env?.PRIVATE_KEY?.trim() ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
    },
  },
  etherscan: {
    apiKey: {
      polygon: process?.env?.POLYGONSCAN_API_KEY ?? "",
      polygonAmoy: process?.env?.POLYGONSCAN_API_KEY ?? "",
    },
  },
  paths: {
    root: "./",
    tests: "./test",
    cache: "./cache",
    sources: "./contracts",
    artifacts: "./artifacts",
  },
  gasReporter: {
    enabled: true,
    currency: "USD",
    outputFile: "gas-report-matic.txt",
    coinmarketcap: process?.env?.COINMARKETCAP_API_KEY ?? "",
    noColors: true,
    token: "POL",
  },
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: process?.env?.POLYGON_MAINNET_URL ?? "",
        blockNumber: 68690480,
      },
    },
    polygon: {
      gas: "auto",
      chainId: 137,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: process?.env?.POLYGON_MAINNET_URL ?? "",
    },
    amoy: {
      gas: "auto",
      chainId: 80002,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: process?.env?.POLYGON_AMOY_URL ?? "",
    },
    citreaTestnet: {
      gas: "auto",
      chainId: 5115,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: process?.env?.CITREA_TESTNET_URL ?? "",
    },
    citrea: {
      gas: "auto",
      chainId: 4114,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: process?.env?.CITREA_MAINNET_URL ?? "",
    },
  },
};

export default config;
