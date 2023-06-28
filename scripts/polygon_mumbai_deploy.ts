import { ethers } from "hardhat";
import { deploy } from "./deploy";

const TOTAL_SUPPLY = ethers.parseEther("100000000");
const WMATIC_ADDRESS = "0x9c3C9283D3e44854697Cd22D3Faa240Cfb032889"; // WMATIC from the forked network

async function main() {
  const network = await ethers.provider.getNetwork();

  if (network.name != "polygon-mumbai") {
    throw new Error("This script should be run on Polygon Mumbai network");
  }

  deploy(TOTAL_SUPPLY, WMATIC_ADDRESS);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
