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

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployController() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const CollateralController = await ethers.getContractFactory(
      "CollateralController",
    );
    const controller = await CollateralController.deploy();

    return {
      controller,
      otherAccount,
      owner,
    };
  }

  beforeEach(async function () {
    const { controller, otherAccount, owner } = await loadFixture(
      deployController,
    );

    _controller = controller;
    _otherAccount = otherAccount;
    _owner = owner;
  });

  describe("Given caller is not a reward pool", async function () {
    it("Should revert with 'NotRewardPool' error", async function () {
      await expect(
        _controller.pushVault(await _otherAccount.getAddress()),
      ).to.be.revertedWithCustomError(_controller, "NotRewardPool");
    });
  });

  describe("Given caller is a reward pool", async function () {
    it("Should emit 'VaultPushed' event", async function () {
      await _controller.addFactory(await _owner.getAddress());
      await _controller.pushRewardPool(await _owner.getAddress());

      await expect(
        _controller.pushVault(await _otherAccount.getAddress()),
      ).to.emit(_controller, "VaultPushed");
    });
  });
});
