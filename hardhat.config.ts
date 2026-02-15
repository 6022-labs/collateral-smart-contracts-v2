import type { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-contract-sizer";

import "dotenv/config";

import "./tasks/add-factory";
import "./tasks/check-supply";
import "./tasks/create-wallet";
import "./tasks/give-ownership";
import "./tasks/impersonate-test";

const privateKey = process?.env?.PRIVATE_KEY?.trim() ?? "";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.28",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000,
      },
      viaIR: true,
    },
  },
  etherscan: {
    apiKey: {
      polygon: process?.env?.ETHERSCAN_API_KEY ?? "",
      polygonAmoy: process?.env?.ETHERSCAN_API_KEY ?? "",
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
    etherscan: process?.env?.ETHERSCAN_API_KEY ?? "",
    noColors: true,
    token: "POL",
  },
  networks: {
    polygon: {
      gas: "auto",
      chainId: 137,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: process?.env?.RPC_URL_POLYGON ?? "",
    },
    "amoy-testnet": {
      gas: "auto",
      chainId: 80002,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: process?.env?.RPC_URL_AMOY_TESTNET ?? "",
    },
    "citrea-testnet": {
      gas: "auto",
      chainId: 5115,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: process?.env?.RPC_URL_CITREA_TESTNET ?? "",
    },
    "citrea-mainnet": {
      gas: "auto",
      chainId: 4114,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: process?.env?.RPC_URL_CITREA ?? "",
    },
  },
};

export default config;
