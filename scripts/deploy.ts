import { ethers } from "hardhat";

export async function deploy(totalSupply: bigint, wETHAddress: string) {
  const Controller6022 = await ethers.getContractFactory("Controller6022");
  const controller6022 = await Controller6022.deploy();
  await controller6022.waitForDeployment();

  let controller6022Address = await controller6022.getAddress();

  console.log("Controller6022 deployed to:", controller6022Address);

  const CollectionGenerator = await ethers.getContractFactory(
    "CollectionGenerator"
  );
  const collectionGenerator = await CollectionGenerator.deploy(
    controller6022Address,
    wETHAddress
  );
  await collectionGenerator.waitForDeployment();

  let collectionGeneratorAddress = await collectionGenerator.getAddress();

  console.log("CollectionGenerator deployed to:", collectionGeneratorAddress);

  const Token6022 = await ethers.getContractFactory("Token6022");
  const token6022 = await Token6022.deploy(totalSupply);
  await token6022.waitForDeployment();

  let token6022Address = await token6022.getAddress();

  console.log("Token6022 deployed to:", token6022Address);

  let tx = await controller6022.updateCollectionGenerator(
    collectionGeneratorAddress
  );
  let receipt = await tx.wait();

  if (!receipt?.status) {
    console.log(receipt?.toJSON());
    throw new Error("updateCollectionGenerator failed");
  }

  console.log("CollectionGenerator updated in Controller6022");

  tx = await controller6022.allowToken(token6022Address);
  receipt = await tx.wait();

  if (!receipt?.status) {
    console.log(receipt?.toJSON());
    throw new Error("updateCollectionGenerator failed");
  }

  console.log("Token6022 allowed in Controller6022");

  tx = await controller6022.allowToken(wETHAddress);
  receipt = await tx.wait();

  if (!receipt?.status) {
    console.log(receipt?.toJSON());
    throw new Error("updateCollectionGenerator failed");
  }

  console.log("WETH allowed in Controller6022");

  return {
    token6022,
    controller6022,
    collectionGenerator,
  };
}
