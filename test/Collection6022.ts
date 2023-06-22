import { expect } from "chai";
import { ethers } from "hardhat";
import {
  reset,
  setBalance,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Collection6022", function () {
  async function deployCollectionWithWMaticFixture() {
    await reset("https://1rpc.io/matic", 44204379);

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Collection6022 = await ethers.getContractFactory("Collection6022");
    const collection6022 = await Collection6022.deploy(
      "Test Collection 6022",
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270" // WMATIC from the forked network
    );

    return { collection6022, owner, otherAccount };
  }

  async function deployCollectionWithTokenFixture() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const totalSupply = ethers.parseUnits("5", 16);

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(totalSupply);

    const Collection6022 = await ethers.getContractFactory("Collection6022");
    const collection6022 = await Collection6022.deploy(
      "Test Collection 6022",
      await token6022.getAddress(),
      "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270" // WMATIC from the forked network
    );

    return { collection6022, token6022, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should work", async function () {
      const { collection6022 } = await loadFixture(
        deployCollectionWithTokenFixture
      );

      expect(await collection6022.isLocked()).to.be.false;
    });
  });

  describe("Deposit token", function () {
    it("Should fail when insufficient allowance", async function () {
      const { collection6022 } = await loadFixture(
        deployCollectionWithTokenFixture
      );

      await expect(collection6022.depositToken(1000)).be.revertedWith(
        "ERC20: insufficient allowance"
      );
    });

    it("Should work when sufficient allowance", async function () {
      const { collection6022, token6022, owner } = await loadFixture(
        deployCollectionWithTokenFixture
      );

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);

      expect(
        await token6022.balanceOf(await collection6022.getAddress())
      ).to.equal(1000);

      expect(await collection6022.isLocked()).to.be.true;
      expect(await collection6022.balanceOf(owner.address)).to.equal(3);
    });
  });

  describe("Batch transfer from owner to other account", function () {
    it("Should fail if not owner", async function () {
      const { collection6022, token6022, otherAccount } = await loadFixture(
        deployCollectionWithTokenFixture
      );

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);

      await expect(
        collection6022.connect(otherAccount).batchTransfer(otherAccount)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });

    it("Should fail when no deposit", async function () {
      const { collection6022, otherAccount } = await loadFixture(
        deployCollectionWithTokenFixture
      );

      // First call should work
      await expect(collection6022.batchTransfer(otherAccount)).be.revertedWith(
        "ERC721: caller is not token owner or approved"
      );
    });

    it("Should transfer 2 NFT when token deposit is done", async function () {
      const { collection6022, token6022, owner, otherAccount } =
        await loadFixture(deployCollectionWithTokenFixture);

      token6022.approve(await collection6022.getAddress(), 1000);

      await collection6022.depositToken(1000);

      await collection6022.batchTransfer(otherAccount);

      expect(await collection6022.balanceOf(owner.address)).to.equal(1);
      expect(await collection6022.balanceOf(otherAccount.address)).to.equal(2);
    });

    it("Should transfer 3 NFT when ether deposit is done", async function () {
      const { collection6022, owner, otherAccount } = await loadFixture(
        deployCollectionWithWMaticFixture
      );

      await collection6022.depositEther({ value: 1000 });

      await collection6022.batchTransfer(otherAccount);

      expect(await collection6022.balanceOf(owner.address)).to.equal(1);
      expect(await collection6022.balanceOf(otherAccount.address)).to.equal(2);
    });
  });

  describe("Deposit ethers", function () {
    it("Should fail when insufficient balance", async function () {
      const { collection6022, owner } = await loadFixture(
        deployCollectionWithWMaticFixture
      );

      await setBalance(owner.address, 999);

      await expect(
        collection6022.depositEther({ value: 1000 })
      ).to.be.rejectedWith(
        "sender doesn't have enough funds to send tx. The max upfront cost is: 8225884143060001000 and the sender's account only has: 999"
      );
    });

    it("Should work when sufficient balance", async function () {
      const { collection6022, owner } = await loadFixture(
        deployCollectionWithWMaticFixture
      );

      await collection6022.depositEther({ value: 1000 });

      expect(await collection6022.isLocked()).to.be.true;
      expect(await collection6022.balanceOf(owner.address)).to.equal(3);
    });
  });
});
