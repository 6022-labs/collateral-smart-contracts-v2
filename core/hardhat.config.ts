import "@nomicfoundation/hardhat-toolbox";
import { HardhatUserConfig } from "hardhat/config";
import deployEverything from "./tasks/deploy-everything";
import deployCollectionGenerator from "./tasks/deploy-collection-generator";

require("dotenv").config();

deployEverything.setDescription("Deploys all contracts to the network");
deployCollectionGenerator.setDescription(
  "Deploys the CollectionGenerator contract to the network"
);

const privateKey = process?.env?.PRIVATE_KEY?.trim() ?? "";
const polygonScanApiKey = process?.env?.POLYGONSCAN_API_KEY?.trim() ?? "";

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
  },
  solidity: {
    version: "0.8.20",
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
};

export default config;
