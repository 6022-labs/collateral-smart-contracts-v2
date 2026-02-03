import { expect } from "chai";
import { ethers } from "hardhat";
import { CollateralRewardPoolFactory } from "../../typechain-types";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When deploying reward pool factory 6022", function () {
  let _rewardPoolFactory: CollateralRewardPoolFactory;

  async function deployRewardPoolFactory() {
    await reset();

    const [owner] = await ethers.getSigners();

    const CollateralController = await ethers.getContractFactory(
      "CollateralController",
    );
    const controller = await CollateralController.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000"),
    );

    const CollateralRewardPoolFactory = await ethers.getContractFactory(
      "CollateralRewardPoolFactory",
    );
    const rewardPoolFactory = await CollateralRewardPoolFactory.deploy(
      await controller.getAddress(),
      await token.getAddress(),
    );

    return {
      rewardPoolFactory,
    };
  }

  beforeEach(async function () {
    ({ rewardPoolFactory: _rewardPoolFactory } = await loadFixture(
      deployRewardPoolFactory,
    ));
  });

  it("Should deploy", async function () {
    expect(await _rewardPoolFactory.getAddress()).not.be.undefined;
  });
});
