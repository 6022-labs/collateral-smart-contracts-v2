import { task } from "hardhat/config";
import * as helpers from "@nomicfoundation/hardhat-network-helpers";

export default task("collateral:impersonate-test")
  .setDescription("Impersonates a signer and calls a function")
  .setAction(async (taskArgs, hre) => {
    await helpers.mine();

    let newOwnerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
    let impersonatedAddress = "0x396dA78933570C4E0E9f717A53c0123627289682";
    let rewardPoolAddress = "0x56ecE1AF0Ac0f4817a60C2D26e97653D215F0A6e";
    let tokenAddress = "0xCDB1DDf9EeA7614961568F2db19e69645Dd708f5";

    let collateralRewardPool = await hre.ethers.getContractAt(
      "CollateralRewardPool",
      rewardPoolAddress
    );

    let token = await hre.ethers.getContractAt(
      "MockERC20",
      tokenAddress
    );

    await hre.ethers.provider.send("hardhat_impersonateAccount", [
      impersonatedAddress,
    ]);
    const impersonatedSigner = await hre.ethers.provider.getSigner(
      impersonatedAddress
    );

    let balanceOfImpersonated = await token
      .connect(impersonatedSigner)
      .balanceOf(impersonatedAddress);

    console.log("Balance of impersonated: ", balanceOfImpersonated.toString());

    let allowance = await token
      .connect(impersonatedSigner)
      .allowance(impersonatedAddress, rewardPoolAddress);

    console.log(
      "Allowance of impersonated to reward pool: ",
      allowance.toString()
    );

    await token
      .connect(impersonatedSigner)
      .transfer(newOwnerAddress, BigInt(100));

    console.log("Transferred 100 tokens to: ", newOwnerAddress);

    let ownerOfRewardPool = await collateralRewardPool.creator();
    if (ownerOfRewardPool !== impersonatedAddress) {
      console.log("Impersonated address is not the owner of reward pool");
      console.log("Owner of reward pool: ", ownerOfRewardPool);
      return;
    }

    await collateralRewardPool
      .connect(impersonatedSigner)
      .transferOwnership(newOwnerAddress);

    console.log("Ownership of reward pool transferred to: ", newOwnerAddress);
  });
