import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config();

const privateKey = process?.env?.PRIVATE_KEY?.trim() ?? "";

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  networks: {
    hardhat: {
      forking: {
        url: "https://bsc-testnet.public.blastapi.io",
      },
    },
    bsctest: {
      chainId: 97,
      accounts: [privateKey],
      url: "https://bsc-testnet.public.blastapi.io",
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
