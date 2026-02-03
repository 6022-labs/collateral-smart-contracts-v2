import { expect } from "chai";
import { ethers } from "hardhat";
import { MockERC20 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When deploying token 6022", function () {
  const totalSupply = ethers.parseUnits("5", 16);

  let _token: MockERC20;
  let _owner: HardhatEthersSigner;

  async function deployToken() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(await owner.getAddress(), totalSupply);

    return { token, owner };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployToken);
    _owner = fixture.owner;
    _token = fixture.token;
  });

  it("Should deploy", async function () {
    expect(await _token.getAddress()).not.be.undefined;
  });

  it("Should set a corresponding total supply to the initial supply", async function () {
    expect(await _token.totalSupply()).to.equal(totalSupply);
  });

  it("Should send the total supply to the caller", async function () {
    expect(await _token.balanceOf(_owner.address)).to.equal(totalSupply);
  });
});
