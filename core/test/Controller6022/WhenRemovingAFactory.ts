import { expect } from "chai";
import { ethers } from "hardhat";
import { Controller6022 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When removing a factory to controller 6022", function () {
  let _controller6022: Controller6022;
  let _otherAccount: HardhatEthersSigner;

  async function deployController() {
    await reset();

    const [_, otherAccount] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    return {
      controller6022,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const { controller6022, otherAccount } =
      await loadFixture(deployController);

    _controller6022 = controller6022;
    _otherAccount = otherAccount;
  });

  describe("Given caller is not an admin", async function () {
    it("Should revert with 'AccessControlUnauthorizedAccount' error", async function () {
      await expect(
        _controller6022
          .connect(_otherAccount)
          .removeFactory(await _otherAccount.getAddress())
      ).to.be.revertedWithCustomError(
        _controller6022,
        "AccessControlUnauthorizedAccount"
      );
    });
  });

  describe("Given caller is an admin", async function () {
    beforeEach(async function () {
      await _controller6022.addFactory(await _otherAccount.getAddress());
    });

    it("Should emit 'FactoryRemoved' event", async function () {
      await expect(
        _controller6022.removeFactory(await _otherAccount.getAddress())
      ).to.emit(_controller6022, "FactoryRemoved");
    });
  });
});
