import { task, types } from "hardhat/config";

export default task("deploy-everything-except-token")
  .addParam("token6022Address", "The address of the token 6022")
  .addOptionalParam(
    "verify",
    "Flag to verify the contracts after deployment",
    false,
    types.boolean
  )
  .setAction(async (taskArgs, hre) => {
    const [owner] = await hre.ethers.getSigners();
    console.log("Deploying contracts with the account:", owner.address);

    const token6022Address = taskArgs.token6022Address;

    const Controller6022 =
      await hre.ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();
    await controller6022.waitForDeployment();

    let controller6022Address = await controller6022.getAddress();

    console.log("Controller6022 deployed to:", controller6022Address);

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

    let tx = await controller6022.addFactory(rewardPoolFactory6022Address);
    let receipt = await tx.wait();

    if (!receipt?.status) {
      console.log(receipt?.toJSON());
      throw new Error("addFactory failed");
    }

    console.log("RewardPoolFactory6022 updated in Controller6022");

    const verify = taskArgs.verify;
    if (verify) {
      // Wait for 5 blocks
      let currentBlock = await hre.ethers.provider.getBlockNumber();
      while (currentBlock + 5 > (await hre.ethers.provider.getBlockNumber())) {}

      await hre.run("verify:verify", {
        address: controller6022Address,
        constructorArguments: [],
      });

      await hre.run("verify:verify", {
        address: rewardPoolFactory6022Address,
        constructorArguments: [controller6022Address, token6022Address],
      });
    }
  });
