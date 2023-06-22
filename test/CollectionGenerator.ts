import { expect } from "chai";
import { ethers } from "hardhat";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("CollectionGenerator", function () {
  async function deployCollectionGeneratorAndTokenFixture() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");

    const controller6022 = await Controller6022.deploy();

    const CollectionGenerator = await ethers.getContractFactory(
      "CollectionGenerator"
    );
    const collectionGenerator = await CollectionGenerator.deploy(
      await controller6022.getAddress(),
      ethers.ZeroAddress
    );

    const totalSupply = ethers.parseUnits("5", 16);

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(totalSupply);

    return { collectionGenerator, token6022, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should work", async function () {
      const { collectionGenerator } = await loadFixture(
        deployCollectionGeneratorAndTokenFixture
      );

      expect(await collectionGenerator.getAddress()).not.to.be.null;
    });
  });

  describe("Generate collection", function () {
    it("Should not work directly", async function () {
      const { collectionGenerator, token6022 } = await loadFixture(
        deployCollectionGeneratorAndTokenFixture
      );

      await expect(
        collectionGenerator.createCollection(
          "Test Collection",
          await token6022.getAddress()
        )
      ).to.be.revertedWith("Only the controller can create collections");
    });
  });
});
