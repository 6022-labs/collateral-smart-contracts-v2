import { task } from "hardhat/config";

export default task("6022:create-wallet")
  .setDescription("Creates a new wallet")
  .setAction(async (taskArgs, hre) => {
    const wallet = hre.ethers.Wallet.createRandom();

    console.log(`Wallet public key: ${wallet.address}`);
    console.log(`Wallet private key: ${wallet.privateKey}`);
  });
