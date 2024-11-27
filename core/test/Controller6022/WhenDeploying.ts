import { expect } from "chai";
import { ethers } from "hardhat";
import { Controller6022 } from "../../typechain-types";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When deploying controller 6022", function () {
  let _controller6022: Controller6022;

  async function deployController() {
    await reset();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    return {
      controller6022,
    };
  }

  beforeEach(async function () {
    const { controller6022 } = await loadFixture(deployController);

    _controller6022 = controller6022;
  });

  it("Should deploy", async function () {
    expect(await _controller6022.getAddress()).not.be.undefined;
  });
});
