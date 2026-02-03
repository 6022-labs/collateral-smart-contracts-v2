import { expect } from "chai";
import { ethers } from "hardhat";
import { CollateralController } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When adding admin to controller 6022", function () {
  let _controller: CollateralController;
  let _otherAccount: HardhatEthersSigner;

  async function deployController() {
    await reset();

    const [_, otherAccount] = await ethers.getSigners();

    const CollateralController = await ethers.getContractFactory("CollateralController");
    const controller = await CollateralController.deploy();

    return {
      controller,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const { otherAccount, controller } =
      await loadFixture(deployController);

    _otherAccount = otherAccount;
    _controller = controller;
  });

  describe("Given caller is not an admin", async function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await expect(
        _controller
          .connect(_otherAccount)
          .addAdmin(await _otherAccount.getAddress())
      ).to.be.revertedWithCustomError(
        _controller,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Given caller is an admin", async function () {
    it("Should emit 'AdminAdded' event", async function () {
      await expect(
        _controller.addAdmin(await _otherAccount.getAddress())
      ).to.emit(_controller, "AdminAdded");
    });
  });
});
