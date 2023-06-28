import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config();

const privateKey = process?.env?.PRIVATE_KEY?.trim() ?? "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {},
    polygon: {
      chainId: 137,
      accounts: [privateKey],
      url: "https://polygon.llamarpc.com",
    },
    "polygon-mumbai": {
      chainId: 80001,
      accounts: [privateKey],
      url: "https://polygon-testnet.public.blastapi.io",
    },
  },
  solidity: {
    version: "0.8.18",
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
};

export default config;
