import { expect } from "chai";
import { ethers } from "hardhat";
import { CollateralController } from "../../typechain-types";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When deploying controller 6022", function () {
  let _controller: CollateralController;

  async function deployController() {
    await reset();

    const CollateralController = await ethers.getContractFactory("CollateralController");
    const controller = await CollateralController.deploy();

    return {
      controller,
    };
  }

  beforeEach(async function () {
    const { controller } = await loadFixture(deployController);

    _controller = controller;
  });

  it("Should deploy", async function () {
    expect(await _controller.getAddress()).not.be.undefined;
  });
});
