import { task } from "hardhat/config";

export default task("6022:update-vault-descriptor")
  .setDescription("Update the vault descriptor in the Controller6022 contract")
  .addParam(
    "controller6022Address",
    "The address of the Controller6022 contract"
  )
  .addParam(
    "vaultDescriptor6022Address",
    "The address of the VaultDescriptor6022 contract"
  )
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Adding factory with the account:", owner.address);

    let controller6022Address = taskArgs.controller6022Address;
    let vaultDescriptor6022Address = taskArgs.vaultDescriptor6022Address;

    const controller6022 = await hre.ethers.getContractAt(
      "Controller6022",
      controller6022Address
    );

    let tx = await controller6022.updateVaultDescriptor(
      vaultDescriptor6022Address
    );
    let receipt = await tx.wait();

    if (!receipt?.status) {
      console.log(receipt?.toJSON());
      throw new Error("updateVaultDescriptor failed");
    }

    console.log("VaultDescriptor6022 updated in Controller6022");
  });
