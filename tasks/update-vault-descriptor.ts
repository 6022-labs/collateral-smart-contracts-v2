import { task } from "hardhat/config";

export default task("collateral:update-vault-descriptor")
  .setDescription(
    "Update the vault descriptor in the CollateralController contract"
  )
  .addParam(
    "controllerAddress",
    "The address of the CollateralController contract"
  )
  .addParam(
    "vaultDescriptorAddress",
    "The address of the CollateralVaultDescriptor contract"
  )
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Adding factory with the account:", owner.address);

    let controllerAddress = taskArgs.controllerAddress;
    let vaultDescriptorAddress = taskArgs.vaultDescriptorAddress;

    const collateralController = await hre.ethers.getContractAt(
      "CollateralController",
      controllerAddress
    );

    let tx = await collateralController.updateVaultDescriptor(
      vaultDescriptorAddress
    );
    let receipt = await tx.wait();

    if (!receipt?.status) {
      console.log(receipt?.toJSON());
      throw new Error("updateVaultDescriptor failed");
    }

    console.log("CollateralVaultDescriptor updated in CollateralController");
  });
