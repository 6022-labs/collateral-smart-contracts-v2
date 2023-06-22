import { expect } from "chai";
import { ethers } from "hardhat";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

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

    const totalSupply = ethers.parseUnits("5", 16);

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
      const { controller6022, collectionGenerator, token6022, owner } =
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
});
