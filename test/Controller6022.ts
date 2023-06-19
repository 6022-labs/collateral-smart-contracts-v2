import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";

describe("Controller6022", function () {
  async function deployController6022AndCollectionGeneratorFixture() {
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

    return { controller6022, collectionGenerator, owner, otherAccount };
  }

  async function deployController6022Fixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    return { controller6022, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should work", async function () {
      const { controller6022, owner } = await loadFixture(
        deployController6022Fixture
      );

      expect(await controller6022.getAddress()).not.to.be.null;
      expect(await controller6022.owner()).to.be.equal(owner.address);
    });
  });

  describe("Update collection generator", function () {
    it("Should work when i'm the owner", async function () {
      const { controller6022, collectionGenerator } = await loadFixture(
        deployController6022AndCollectionGeneratorFixture
      );

      await controller6022.updateCollectionGenerator(
        await collectionGenerator.getAddress()
      );

      expect(await controller6022.getCollectionGeneratorAddress()).to.be.equal(
        await collectionGenerator.getAddress()
      );
    });

    it("Should fail when i'm not the owner", async function () {
      const { controller6022, collectionGenerator, otherAccount } =
        await loadFixture(deployController6022AndCollectionGeneratorFixture);

      await expect(
        controller6022
          .connect(otherAccount)
          .updateCollectionGenerator(await collectionGenerator.getAddress())
      ).to.be.reverted;
    });
  });

  describe("Create collection", function () {
    it("Should work", async function () {
      const { controller6022, collectionGenerator, owner } = await loadFixture(
        deployController6022AndCollectionGeneratorFixture
      );

      await controller6022.updateCollectionGenerator(
        await collectionGenerator.getAddress()
      );

      await expect(controller6022.createCollection("Test collection")).to.emit(
        controller6022,
        "CollectionCreated"
      );

      let tx = await controller6022.createCollection("Test collection");
      let receipt = await tx.wait();

      expect(tx).to.emit(controller6022, "CollectionCreated");

      let event = <EventLog>(
        receipt?.logs.filter((x) => x instanceof EventLog)[0]
      );

      const collectionAddress = event?.args.at(0);

      const Collection6022 = await ethers.getContractFactory("Collection6022");
      const collection6022: any = await Collection6022.attach(
        collectionAddress
      );

      expect(await collection6022.balanceOf(owner.address)).to.equal(3);
    });
  });
});
