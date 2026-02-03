import { expect } from "chai";
import { ethers } from "hardhat";
import { RewardPoolFactory } from "../../typechain-types";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When deploying reward pool factory 6022", function () {
  let _rewardPoolFactory: RewardPoolFactory;

  async function deployRewardPoolFactory() {
    await reset();

    const [owner] = await ethers.getSigners();

    const Controller = await ethers.getContractFactory("Controller");
    const controller = await Controller.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const RewardPoolFactory = await ethers.getContractFactory(
      "RewardPoolFactory"
    );
    const rewardPoolFactory = await RewardPoolFactory.deploy(
      await controller.getAddress(),
      await token.getAddress()
    );

    return {
      rewardPoolFactory,
    };
  }

  beforeEach(async function () {
    ({ rewardPoolFactory: _rewardPoolFactory } = await loadFixture(
      deployRewardPoolFactory
    ));
  });

  it("Should deploy", async function () {
    expect(await _rewardPoolFactory.getAddress()).not.be.undefined;
  });
});
