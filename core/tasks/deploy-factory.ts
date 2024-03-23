import { task } from "hardhat/config";
import { Controller6022 } from "../typechain-types";

export default task("deploy-factory")
  .addParam(
    "controller6022Address",
    "The address of the Controller6022 contract"
  )
  .addParam("token6022Address", "The address of the token 6022")
  .setAction(async (taskArgs, hre) => {
    const token6022Address = taskArgs.token6022Address;
    const controller6022Address = taskArgs.controller6022Address;

    const RewardPoolFactory6022 = await hre.ethers.getContractFactory(
      "RewardPoolFactory6022"
    );
    const rewardPoolFactory6022 = await RewardPoolFactory6022.deploy(
      controller6022Address,
      token6022Address
    );
    await rewardPoolFactory6022.waitForDeployment();

    let rewardPoolFactory6022Address = await rewardPoolFactory6022.getAddress();

    console.log(
      "RewardPoolFactory6022 deployed to:",
      rewardPoolFactory6022Address
    );

    const Controller6022 =
      await hre.ethers.getContractFactory("Controller6022");
    const controller6022 = Controller6022.attach(
      controller6022Address
    ) as Controller6022;

    let tx = await controller6022.addFactory(rewardPoolFactory6022Address);
    let receipt = await tx.wait();

    if (!receipt?.status) {
      console.log(receipt?.toJSON());
      throw new Error("addFactory failed");
    }

    if (hre.network.name !== "hardhat") {
      // Wait for 5 blocks
      let currentBlock = await hre.ethers.provider.getBlockNumber();
      while (currentBlock + 5 > (await hre.ethers.provider.getBlockNumber())) {}

      await hre.run("verify:verify", {
        address: rewardPoolFactory6022Address,
        constructorArguments: [controller6022Address, token6022Address],
      });
    }

    console.log("CollectionGenerator updated in Controller6022");
  });
