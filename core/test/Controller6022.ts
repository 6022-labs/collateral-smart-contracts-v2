import { expect } from "chai";
import { ethers } from "hardhat";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { EventLog } from "ethers";

describe("Controller6022", function () {
  async function deployController6022AndCollectionGeneratorAndTokenFixture() {
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

    const totalSupply = ethers.parseEther("5000000");

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(totalSupply);

    return {
      controller6022,
      collectionGenerator,
      token6022,
      owner,
      otherAccount,
    };
  }

  async function deployController6022AndCollectionGeneratorFixture() {
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

    return { controller6022, collectionGenerator, owner, otherAccount };
  }

  async function deployController6022Fixture() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    return { controller6022, owner, otherAccount };
  }

  // -------------------- DEPLOYMENT -------------------- //
  describe("Deployment", function () {
    it("Should work", async function () {
      const { controller6022, owner } = await loadFixture(
        deployController6022Fixture
      );

      expect(await controller6022.getAddress()).not.to.be.null;
      expect(await controller6022.owner()).to.be.equal(owner.address);
    });
  });

  // -------------------- UPDATE COLLECTION GENERATOR -------------------- //
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

  // -------------------- ALLOW TOKEN -------------------- //
  describe("Allow token", function () {
    it("Should work when i'm the owner", async function () {
      const { controller6022, collectionGenerator, token6022 } =
        await loadFixture(
          deployController6022AndCollectionGeneratorAndTokenFixture
        );

      await controller6022.updateCollectionGenerator(
        await collectionGenerator.getAddress()
      );

      await expect(controller6022.allowToken(await token6022.getAddress())).not
        .be.reverted;
    });

    it("Should fail when i'm not the owner", async function () {
      const { controller6022, collectionGenerator, token6022, otherAccount } =
        await loadFixture(
          deployController6022AndCollectionGeneratorAndTokenFixture
        );

      await controller6022.updateCollectionGenerator(
        await collectionGenerator.getAddress()
      );

      await expect(
        controller6022
          .connect(otherAccount)
          .allowToken(await token6022.getAddress())
      ).be.reverted;
    });
  });

  // -------------------- CREATE COLLECTION -------------------- //
  describe("Create collection", function () {
    it("Should work", async function () {
      const { controller6022, collectionGenerator, token6022 } =
        await loadFixture(
          deployController6022AndCollectionGeneratorAndTokenFixture
        );

      await controller6022.updateCollectionGenerator(
        await collectionGenerator.getAddress()
      );

      controller6022.allowToken(await token6022.getAddress());

      await expect(
        controller6022.createCollection(
          "Test collection",
          await token6022.getAddress()
        )
      ).to.emit(controller6022, "CollectionCreated");
    });

    it("Should fail when the token is not allowed", async function () {
      const { controller6022, collectionGenerator, token6022 } =
        await loadFixture(
          deployController6022AndCollectionGeneratorAndTokenFixture
        );

      await controller6022.updateCollectionGenerator(
        await collectionGenerator.getAddress()
      );

      await expect(
        controller6022.createCollection(
          "Test collection",
          await token6022.getAddress()
        )
      ).be.revertedWith("Token not allowed");
    });
  });

  // -------------------- GET COLLECTIONS BY CREATOR -------------------- //
  describe("Get collections by creator", function () {
    it("Should work", async function () {
      const { controller6022, collectionGenerator, token6022, owner } =
        await loadFixture(
          deployController6022AndCollectionGeneratorAndTokenFixture
        );

      await controller6022.updateCollectionGenerator(
        await collectionGenerator.getAddress()
      );

      controller6022.allowToken(await token6022.getAddress());

      let tx = await controller6022.createCollection(
        "Test collection",
        await token6022.getAddress()
      );

      let receipt = await tx.wait();

      let event = <EventLog>(
        receipt?.logs.filter((x) => x instanceof EventLog)[0]
      );
      let arg1 = event?.args.at(0);

      let creatorCollections = await controller6022.getCollectionsByCreator(
        owner.address
      );

      expect(creatorCollections.length).to.be.equal(1);
      expect(creatorCollections[0]).to.be.equal(arg1);
    });
  });

  // -------------------- GET COLLECTIONS BY OWNER -------------------- //
  describe("Get collections by owner", function () {
    it("Should work", async function () {
      const { controller6022, collectionGenerator, token6022, owner } =
        await loadFixture(
          deployController6022AndCollectionGeneratorAndTokenFixture
        );

      await controller6022.updateCollectionGenerator(
        await collectionGenerator.getAddress()
      );

      controller6022.allowToken(await token6022.getAddress());

      let tx = await controller6022.createCollection(
        "Test collection",
        await token6022.getAddress()
      );

      let receipt = await tx.wait();

      let event = <EventLog>(
        receipt?.logs.filter((x) => x instanceof EventLog)[0]
      );
      let arg1 = event?.args.at(0);

      let ownerCollections = await controller6022.getCollectionsByOwner(
        owner.address
      );
      expect(ownerCollections.length).to.be.equal(0);

      const Collection6022 = await ethers.getContractFactory("Collection6022");
      const collection6022Contract = Collection6022.attach(arg1) as any;

      await token6022.approve(arg1, ethers.parseEther("1"));
      await collection6022Contract.depositToken(ethers.parseEther("1"));

      ownerCollections = await controller6022.getCollectionsByOwner(
        owner.address
      );

      expect(ownerCollections.length).to.be.equal(1);
      expect(ownerCollections[0]).to.be.equal(arg1);
    });
  });
});
