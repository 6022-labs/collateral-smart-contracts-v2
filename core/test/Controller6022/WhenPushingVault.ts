import { expect } from "chai";
import { ethers } from "hardhat";
import { Controller6022 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When pushing vault to controller 6022", function () {
  let _controller6022: Controller6022;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployController() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    return {
      controller6022,
      otherAccount,
      owner,
    };
  }

  beforeEach(async function () {
    const { controller6022, otherAccount, owner } =
      await loadFixture(deployController);

    _controller6022 = controller6022;
    _otherAccount = otherAccount;
    _owner = owner;
  });

  describe("Given caller is not a reward pool", async function () {
    it("Should revert with 'NotRewardPool' error", async function () {
      await expect(
        _controller6022.pushVault(await _otherAccount.getAddress())
      ).to.be.revertedWithCustomError(_controller6022, "NotRewardPool");
    });
  });

  describe("Given caller is a reward pool", async function () {
    it("Should emit 'VaultPushed' event", async function () {
      await _controller6022.addFactory(await _owner.getAddress());
      await _controller6022.pushRewardPool(await _owner.getAddress());

      await expect(
        _controller6022.pushVault(await _otherAccount.getAddress())
      ).to.emit(_controller6022, "VaultPushed");
    });
  });
});
