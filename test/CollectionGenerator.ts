import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("CollectionGenerator", function () {
  async function deployCollectionGeneratorFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");

    const controller6022 = await Controller6022.deploy();

    const CollectionGenerator = await ethers.getContractFactory(
      "CollectionGenerator"
    );
    const collectionGenerator = await CollectionGenerator.deploy(
      await controller6022.getAddress()
    );

    return { collectionGenerator, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should work", async function () {
      const { collectionGenerator, owner } = await loadFixture(
        deployCollectionGeneratorFixture
      );

      expect(await collectionGenerator.getAddress()).not.to.be.null;
    });
  });

  describe("Generate collection", function () {
    it("Should not work directly", async function () {
      const { collectionGenerator, owner } = await loadFixture(
        deployCollectionGeneratorFixture
      );

      await expect(
        collectionGenerator.createCollection(owner.address, "Test Collection")
      ).to.be.revertedWith("Only the controller can create collections");
    });
  });
});
