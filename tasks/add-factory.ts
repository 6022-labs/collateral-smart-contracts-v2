import { task } from "hardhat/config";

export default task("collateral:add-factory")
  .setDescription("Add a factory to the CollateralController contract")
  .addParam(
    "controllerAddress",
    "The address of the CollateralController contract"
  )
  .addParam(
    "rewardPoolFactoryAddress",
    "The address of the CollateralRewardPoolFactory contract"
  )
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Adding factory with the account:", owner.address);

    let controllerAddress = taskArgs.controllerAddress;
    let rewardPoolFactoryAddress = taskArgs.rewardPoolFactoryAddress;

    const collateralController = await hre.ethers.getContractAt(
      "CollateralController",
      controllerAddress
    );

    let tx = await collateralController.addFactory(rewardPoolFactoryAddress);
    let receipt = await tx.wait();

    if (!receipt?.status) {
      console.log(receipt?.toJSON());
      throw new Error("addFactory failed");
    }

    console.log(
      "CollateralRewardPoolFactory added as factory in CollateralController"
    );
  });
