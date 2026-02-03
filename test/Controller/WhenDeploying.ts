import { expect } from "chai";
import { ethers } from "hardhat";
import { Controller } from "../../typechain-types";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When deploying controller 6022", function () {
  let _controller: Controller;

  async function deployController() {
    await reset();

    const Controller = await ethers.getContractFactory("Controller");
    const controller = await Controller.deploy();

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
