import { task } from "hardhat/config";
import { CollateralController } from "../typechain-types";

export default task("collateral:give-ownership")
  .setDescription(
    "Gives ownership of the controller contract to another address"
  )
  .addParam("controllerAddress", "The address of the collateral controller")
  .addParam("newOwnerAddress", "The address of the new owner")
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Giving ownership with the account:", owner.address);

    const newOwnerAddress = taskArgs.newOwnerAddress;
    const controllerAddress = taskArgs.controllerAddress;

    const CollateralController = await hre.ethers.getContractFactory(
      "CollateralController"
    );
    const collateralController = (await CollateralController.attach(
      controllerAddress
    )) as CollateralController;

    console.log("Giving ownership to", newOwnerAddress);

    await collateralController.addAdmin(newOwnerAddress);
    console.log("Ownership given to", newOwnerAddress);

    await collateralController.removeAdmin(owner.address);
    console.log("Ownership removed from", owner.address);
  });
