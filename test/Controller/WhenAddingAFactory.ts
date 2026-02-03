import { expect } from "chai";
import { ethers } from "hardhat";
import { Controller } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When adding a factory to controller 6022", function () {
  let _controller: Controller;
  let _otherAccount: HardhatEthersSigner;

  async function deployController() {
    await reset();

    const [_, otherAccount] = await ethers.getSigners();

    const Controller = await ethers.getContractFactory("Controller");
    const controller = await Controller.deploy();

    return {
      controller,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const { controller, otherAccount } =
      await loadFixture(deployController);

    _controller = controller;
    _otherAccount = otherAccount;
  });

  describe("Given caller is not an admin", async function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await expect(
        _controller
          .connect(_otherAccount)
          .addFactory(await _otherAccount.getAddress())
      ).to.be.revertedWithCustomError(
        _controller,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Given caller is an admin", async function () {
    it("Should emit 'FactoryAdded' event", async function () {
      await expect(
        _controller.addFactory(await _otherAccount.getAddress())
      ).to.emit(_controller, "FactoryAdded");
    });
  });
});
