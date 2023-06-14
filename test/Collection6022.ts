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
});
