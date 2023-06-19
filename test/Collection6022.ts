import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Collection6022", function () {
  async function deployCollectionFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Collection6022 = await ethers.getContractFactory("Collection6022");
    const collection6022 = await Collection6022.deploy(
      owner.address,
      "Test Collection 6022"
    );

    return { collection6022, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      const { collection6022, owner } = await loadFixture(
        deployCollectionFixture
      );

      expect(await collection6022.balanceOf(owner.address)).to.equal(3);

      expect(await collection6022.ownerOf(1)).to.equal(owner.address);
      expect(await collection6022.ownerOf(2)).to.equal(owner.address);
      expect(await collection6022.ownerOf(3)).to.equal(owner.address);
    });
  });

  describe("Batch transfer from owner to other account", function () {
    it("Should transfer 2 NFT", async function () {
      const { collection6022, owner, otherAccount } = await loadFixture(
        deployCollectionFixture
      );

      await collection6022.batchTransfer(otherAccount);

      expect(await collection6022.balanceOf(owner.address)).to.equal(1);
      expect(await collection6022.balanceOf(otherAccount.address)).to.equal(2);
    });

    it("Should fail if not owner", async function () {
      const { collection6022, otherAccount } = await loadFixture(
        deployCollectionFixture
      );

      await expect(
        collection6022.connect(otherAccount).batchTransfer(otherAccount)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });

    it("Should fail if not enough balance", async function () {
      const { collection6022, otherAccount } = await loadFixture(
        deployCollectionFixture
      );

      // First call should work
      await expect(collection6022.batchTransfer(otherAccount)).to.not.be
        .reverted;

      // Second call should fail
      await expect(
        collection6022.batchTransfer(otherAccount)
      ).to.be.revertedWith("ERC721: caller is not token owner or approved");
    });
  });
});
