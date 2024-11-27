import { expect } from "chai";
import { ethers } from "hardhat";
import { RewardPoolFactory6022 } from "../../typechain-types";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When creating reward pool from factory 6022", function () {
  let _rewardPoolFactory6022: RewardPoolFactory6022;

  async function deployRewardPoolFactory() {
    await reset();

    const [owner] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

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
    };
  }

  beforeEach(async function () {
    const { rewardPoolFactory6022 } = await loadFixture(
      deployRewardPoolFactory
    );

    _rewardPoolFactory6022 = rewardPoolFactory6022;
  });

  describe("Given caller already has a reward pool", async function () {
    beforeEach(async function () {
      await _rewardPoolFactory6022.createRewardPool();
    });

    it("Should revert with 'AlreadyCreatedRewardPool' error", async function () {
      await expect(
        _rewardPoolFactory6022.createRewardPool()
      ).to.be.revertedWithCustomError(
        _rewardPoolFactory6022,
        "AlreadyCreatedRewardPool"
      );
    });
  });

  describe("Given caller hasn't already a reward pool", async function () {
    it("Should emit 'RewardPoolCreated' event", async function () {
      await expect(_rewardPoolFactory6022.createRewardPool()).to.emit(
        _rewardPoolFactory6022,
        "RewardPoolCreated"
      );
    });
  });
});
