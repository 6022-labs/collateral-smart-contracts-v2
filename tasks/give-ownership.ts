import { task } from "hardhat/config";
import { Controller6022 } from "../typechain-types";

export default task("6022:give-ownership")
  .setDescription(
    "Gives ownership of the controller contract to another address"
  )
  .addParam("controller6022Address", "The address of the controller 6022")
  .addParam("newOwnerAddress", "The address of the new owner")
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Giving ownership with the account:", owner.address);

    const newOwnerAddress = taskArgs.newOwnerAddress;
    const controller6022Address = taskArgs.controller6022Address;

    const Controller6022 = await hre.ethers.getContractFactory(
      "Controller6022"
    );
    const controller6022 = (await Controller6022.attach(
      controller6022Address
    )) as Controller6022;

    console.log("Giving ownership to", newOwnerAddress);

    await controller6022.addAdmin(newOwnerAddress);
    console.log("Ownership given to", newOwnerAddress);

    await controller6022.removeAdmin(owner.address);
    console.log("Ownership removed from", owner.address);
  });
