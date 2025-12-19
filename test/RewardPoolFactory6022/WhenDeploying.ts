import { expect } from "chai";
import { ethers } from "hardhat";
import { RewardPoolFactory6022 } from "../../typechain-types";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When deploying reward pool factory 6022", function () {
  let _rewardPoolFactory6022: RewardPoolFactory6022;

  async function deployRewardPoolFactory() {
    await reset();

    const [owner] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token6022 = await MockERC20.deploy(
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

    return {
      rewardPoolFactory6022,
    };
  }

  beforeEach(async function () {
    ({ rewardPoolFactory6022: _rewardPoolFactory6022 } = await loadFixture(
      deployRewardPoolFactory
    ));
  });

  it("Should deploy", async function () {
    expect(await _rewardPoolFactory6022.getAddress()).not.be.undefined;
  });
});
