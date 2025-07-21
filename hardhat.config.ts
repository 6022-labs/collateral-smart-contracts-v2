import "@nomicfoundation/hardhat-toolbox";
import checkSupply from "./tasks/check-supply";
import createWallet from "./tasks/create-wallet";
import { HardhatUserConfig } from "hardhat/config";
import giveOwnership from "./tasks/give-ownership";
import impersonateTest from "./tasks/impersonate-test";
import deployEverything from "./tasks/deploy-everything";
import deployEverythingExceptToken from "./tasks/deploy-everything-except-token";

require("dotenv").config();

createWallet.setDescription("Creates a new wallet");
checkSupply.setDescription("Checks the total supply of the token");
deployEverything.setDescription("Deploys all contracts to the network");
deployEverythingExceptToken.setDescription(
  "Deploys the RewardPoolFactory contract and RewardPoolController to the network"
);
impersonateTest.setDescription("Impersonates a signer and calls a function");
giveOwnership.setDescription(
  "Gives ownership of the controller contract to another address"
);

const infuraKey = process?.env?.INFURA_KEY?.trim() ?? "";
const privateKey = process?.env?.PRIVATE_KEY?.trim() ?? "";
const polygonScanApiKey = process?.env?.POLYGONSCAN_API_KEY?.trim() ?? "";
const coinmarketcapApiKey = process?.env?.COINMARKETCAP_API_KEY?.trim() ?? "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        enabled: true,
        url: "https://polygon-mainnet.infura.io/v3/" + infuraKey,
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
      url: "https://polygon-mainnet.infura.io/v3/" + infuraKey,
    },
    amoy: {
      gas: "auto",
      chainId: 80002,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://polygon-amoy.infura.io/v3/" + infuraKey,
    },
    citreaTestnet: {
      gas: "auto",
      chainId: 5115,
      gasMultiplier: 2,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://rpc.testnet.citrea.xyz",
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 1000, // https://docs.soliditylang.org/en/latest/internals/optimizer.html#optimizer-parameter-runs
      },
    },
  },
  etherscan: {
    apiKey: {
      polygon: polygonScanApiKey,
      polygonAmoy: polygonScanApiKey,
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
    coinmarketcap: coinmarketcapApiKey,
    noColors: true,
    token: "POL",
  },
};

export default config;
