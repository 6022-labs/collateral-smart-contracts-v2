import { expect } from "chai";
import { ethers } from "hardhat";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("RewardPoolFactory6022", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployRewardPoolFactory6022() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(ethers.parseEther("100000"));

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const RewardPoolFactory6022 = await ethers.getContractFactory(
      "RewardPoolFactory6022"
    );
    const rewardPoolFactory6022 = await RewardPoolFactory6022.deploy(
      await controller6022.getAddress(),
      await token6022.getAddress()
    );

    await controller6022.addFactory(await rewardPoolFactory6022.getAddress());

    return {
      rewardPoolFactory6022,
      owner,
      otherAccount,
    };
  }

  describe("Deployment", function () {
    it("Should work", async function () {
      const { rewardPoolFactory6022 } = await loadFixture(
        deployRewardPoolFactory6022
      );
      expect(await rewardPoolFactory6022.getAddress()).not.be.undefined;
    });
  });

  describe("createRewardPool", function () {
    it("Should fail if caller already has a reward pool", async function () {
      const { rewardPoolFactory6022 } = await loadFixture(
        deployRewardPoolFactory6022
      );

      await rewardPoolFactory6022.createRewardPool();

      await expect(
        rewardPoolFactory6022.createRewardPool()
      ).to.be.revertedWithCustomError(
        rewardPoolFactory6022,
        "AlreadyCreatedRewardPool"
      );
    });

    it("Should work", async function () {
      const { rewardPoolFactory6022 } = await loadFixture(
        deployRewardPoolFactory6022
      );

      await expect(rewardPoolFactory6022.createRewardPool()).to.emit(
        rewardPoolFactory6022,
        "RewardPoolCreated"
      );
    });
  });
});
