import { ethers } from "hardhat";
import { deploy } from "./deploy";

const TOTAL_SUPPLY = ethers.parseEther("100000000");
const WMATIC_ADDRESS = "0x0d500B1d8E8eF31E21C99d1Db9A6444d3ADf1270"; // WMATIC from the forked network

async function main() {
  const network = await ethers.provider.getNetwork();

  if (network.name != "polygon") {
    throw new Error("This script should be run on Polygon network");
  }

  deploy(TOTAL_SUPPLY, WMATIC_ADDRESS);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
