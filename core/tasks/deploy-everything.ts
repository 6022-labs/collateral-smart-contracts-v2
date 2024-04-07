import { task } from "hardhat/config";

export default task("deploy-everything")
  .addParam("totalSupply", "The total supply of the token")
  .addOptionalParam("minter", "The address to deploy the token to")
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", owner.address);

    let minter = taskArgs.minter;
    const totalSupply = taskArgs.totalSupply;

    if (!minter) {
      minter = owner.address;
    }

    console.log("Minter address:", minter);

    const Controller6022 =
      await hre.ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy({
      nonce: 1,
      gasPrice: hre.ethers.parseUnits("120", "gwei"),
    });
    await controller6022.waitForDeployment();

    let controller6022Address = await controller6022.getAddress();

    console.log("Controller6022 deployed to:", controller6022Address);

    const Token6022 = await hre.ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(minter, totalSupply, {
      nonce: 1,
      gasPrice: hre.ethers.parseUnits("120", "gwei"),
    });
    await token6022.waitForDeployment();

    let token6022Address = await token6022.getAddress();

    console.log("Token6022 deployed to:", token6022Address);

    const RewardPoolFactory6022 = await hre.ethers.getContractFactory(
      "RewardPoolFactory6022"
    );
    const rewardPoolFactory6022 = await RewardPoolFactory6022.deploy(
      controller6022Address,
      token6022Address,
      {
        nonce: 2,
        gasPrice: hre.ethers.parseUnits("120", "gwei"),
      }
    );
    await rewardPoolFactory6022.waitForDeployment();

    let rewardPoolFactory6022Address = await rewardPoolFactory6022.getAddress();

    console.log(
      "RewardPoolFactory6022 deployed to:",
      rewardPoolFactory6022Address
    );

    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      // Wait for 5 blocks
      let currentBlock = await hre.ethers.provider.getBlockNumber();
      while (currentBlock + 5 > (await hre.ethers.provider.getBlockNumber())) {}
    }

    let tx = await controller6022.addFactory(rewardPoolFactory6022Address, {
      nonce: 3,
      gasPrice: hre.ethers.parseUnits("120", "gwei"),
    });
    let receipt = await tx.wait();

    if (!receipt?.status) {
      console.log(receipt?.toJSON());
      throw new Error("updateCollectionGenerator failed");
    }

    console.log("RewardPoolFactory6022 added as factory in Controller6022");

    if (owner.address != minter) {
      tx = await controller6022.addAdmin(minter, {
        nonce: 3,
        gasPrice: hre.ethers.parseUnits("120", "gwei"),
      });
      receipt = await tx.wait();

      if (!receipt?.status) {
        console.log(receipt?.toJSON());
        throw new Error("Error adding minter as admin in Controller6022");
      }

      console.log("Minter added as admin in Controller6022");

      tx = await controller6022.removeAdmin(owner.address, {
        nonce: 4,
        gasPrice: hre.ethers.parseUnits("120", "gwei"),
      });
      receipt = await tx.wait();

      if (!receipt?.status) {
        console.log(receipt?.toJSON());
        throw new Error("Error removing owner as admin in Controller6022");
      }

      console.log("Owner removed as admin in Controller6022");
    }

    if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
      // Wait for 5 blocks
      let currentBlock = await hre.ethers.provider.getBlockNumber();
      while (currentBlock + 5 > (await hre.ethers.provider.getBlockNumber())) {}

      await hre.run("verify:verify", {
        address: controller6022Address,
        constructorArguments: [],
      });

      await hre.run("verify:verify", {
        address: token6022Address,
        constructorArguments: [minter, totalSupply],
      });

      await hre.run("verify:verify", {
        address: rewardPoolFactory6022Address,
        constructorArguments: [controller6022Address, token6022Address],
      });
    }
  });
