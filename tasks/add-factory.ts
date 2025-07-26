import { task, types } from "hardhat/config";

export default task("add-factory")
  .addParam(
    "controller6022Address",
    "The address of the Controller6022 contract"
  )
  .addParam(
    "rewardPoolFactory6022Address",
    "The address of the RewardPoolFactory6022 contract"
  )
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Adding factory with the account:", owner.address);

    let controller6022Address = taskArgs.controller6022Address;
    let rewardPoolFactory6022Address = taskArgs.rewardPoolFactory6022Address;

    const controller6022 = await hre.ethers.getContractAt(
      "Controller6022",
      controller6022Address
    );

    let tx = await controller6022.addFactory(rewardPoolFactory6022Address);
    let receipt = await tx.wait();

    if (!receipt?.status) {
      console.log(receipt?.toJSON());
      throw new Error("addFactory failed");
    }

    console.log("RewardPoolFactory6022 added as factory in Controller6022");
  });
