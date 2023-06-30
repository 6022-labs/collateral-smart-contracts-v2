import { task } from "hardhat/config";

export default task("deploy-collection-generator")
  .addParam(
    "controller6022Address",
    "The address of the Controller6022 contract"
  )
  .addParam("wethAddress", "The address of the WETH token")
  .setAction(async (taskArgs, hre) => {
    const wETHAddress = taskArgs.wethAddress;
    const controller6022Address = taskArgs.controller6022Address;

    const CollectionGenerator = await hre.ethers.getContractFactory(
      "CollectionGenerator"
    );
    const collectionGenerator = await CollectionGenerator.deploy(
      controller6022Address,
      wETHAddress
    );
    await collectionGenerator.waitForDeployment();

    let collectionGeneratorAddress = await collectionGenerator.getAddress();

    console.log("CollectionGenerator deployed to:", collectionGeneratorAddress);

    // Wait for 5 blocks
    let currentBlock = await hre.ethers.provider.getBlockNumber();
    while (currentBlock + 5 > (await hre.ethers.provider.getBlockNumber())) {}

    await hre.run("verify:verify", {
      address: collectionGeneratorAddress,
      constructorArguments: [controller6022Address, wETHAddress],
    });

    const Controller6022 = await hre.ethers.getContractFactory(
      "Controller6022"
    );
    const controller6022 = Controller6022.attach(controller6022Address) as any;

    let tx = await controller6022.updateCollectionGenerator(
      collectionGeneratorAddress
    );
    let receipt = await tx.wait();

    if (!receipt?.status) {
      console.log(receipt?.toJSON());
      throw new Error("updateCollectionGenerator failed");
    }

    console.log("CollectionGenerator updated in Controller6022");
  });
