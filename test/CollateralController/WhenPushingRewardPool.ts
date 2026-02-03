import { expect } from "chai";
import { ethers } from "hardhat";
import { CollateralController } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When pushing vault to controller 6022", function () {
  let _controller: CollateralController;
  let _otherAccount: HardhatEthersSigner;

  async function deployController() {
    await reset();

    const [_, otherAccount] = await ethers.getSigners();

    const CollateralController = await ethers.getContractFactory(
      "CollateralController",
    );
    const controller = await CollateralController.deploy();

    return {
      controller,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const { controller, otherAccount } = await loadFixture(deployController);

    _controller = controller;
    _otherAccount = otherAccount;
  });

  describe("Given caller is not a factory", async function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await expect(
        _controller
          .connect(_otherAccount)
          .pushRewardPool(await _otherAccount.getAddress()),
      ).to.be.revertedWithCustomError(
        _controller,
        "AccessControlUnauthorizedAccount",
      );
    });
  });

  describe("Given caller is a factory", async function () {
    beforeEach(async function () {
      await _controller.addFactory(await _otherAccount.getAddress());
    });

    it("Should emit 'RewardPoolPushed' event", async function () {
      await expect(
        _controller
          .connect(_otherAccount)
          .pushRewardPool(await _otherAccount.getAddress()),
      ).to.emit(_controller, "RewardPoolPushed");
    });
  });
});
