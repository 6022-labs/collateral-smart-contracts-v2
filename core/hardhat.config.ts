import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import deployEverything from "./tasks/deploy-everything";
import deployDeployFactory from "./tasks/deploy-factory";

require("dotenv").config();

deployEverything.setDescription("Deploys all contracts to the network");
deployDeployFactory.setDescription(
  "Deploys the RewardPoolFactory contract to the network"
);

const privateKey = process?.env?.PRIVATE_KEY?.trim() ?? "";
const polygonScanApiKey = process?.env?.POLYGONSCAN_API_KEY?.trim() ?? "";
const coinmarketcapApiKey = process?.env?.COINMARKETCAP_API_KEY?.trim() ?? "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    polygon: {
      chainId: 137,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://polygon.llamarpc.com",
    },
    mumbai: {
      chainId: 80001,
      accounts: [privateKey],
      throwOnCallFailures: true,
      throwOnTransactionFailures: true,
      allowUnlimitedContractSize: true,
      url: "https://polygon-testnet.public.blastapi.io",
    },
    local: {
      chainId: 31337,
      accounts: [privateKey],
      url: "http://localhost:8545",
    },
  },
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 100000000, // https://docs.soliditylang.org/en/latest/internals/optimizer.html#optimizer-parameter-runs
      },
    },
  },
  etherscan: {
    apiKey: {
      polygon: polygonScanApiKey,
      polygonMumbai: polygonScanApiKey,
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
    token: "MATIC",
  },
};

export default config;
