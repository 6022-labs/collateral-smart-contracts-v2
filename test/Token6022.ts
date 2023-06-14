import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { expect } from "chai";
import { ethers } from "hardhat";

describe("Token6022", function () {
  const totalSupply = ethers.parseUnits("5", 16);

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployTokenFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(totalSupply);

    return { token6022, owner, otherAccount };
  }

  describe("Deployment", function () {
    it("Should set the right supply", async function () {
      const { token6022 } = await loadFixture(deployTokenFixture);

      expect(await token6022.totalSupply()).to.equal(totalSupply);
    });
  });

  describe("Transactions", function () {
    it("Should transfer tokens between accounts", async function () {
      const { token6022, owner, otherAccount } = await loadFixture(
        deployTokenFixture
      );

      let transferValue = ethers.parseUnits("1", 16);

      // Transfer 50 tokens from owner to otherAccount
      await token6022.transfer(otherAccount.address, transferValue);

      // Check balances
      expect(await token6022.balanceOf(owner.address)).to.equal(
        totalSupply - transferValue
      );
    });
  });

  describe("Allowance", function () {
    it("Should allow to transfer tokens between accounts", async function () {
      const { token6022, owner, otherAccount } = await loadFixture(
        deployTokenFixture
      );

      // Transfer 50 tokens from owner to otherAccount
      await token6022.approve(otherAccount.address, 50);

      // Check balances
      expect(
        await token6022.allowance(owner.address, otherAccount.address)
      ).to.equal(50);
    });
  });
});
