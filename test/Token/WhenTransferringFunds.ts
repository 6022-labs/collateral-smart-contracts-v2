import { expect } from "chai";
import { ethers } from "hardhat";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { MockERC20 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("When transferring funds of token 6022", function () {
  const totalSupply = ethers.parseUnits("5", 16);

  let _token: MockERC20;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployToken() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      totalSupply
    );

    return { token, otherAccount, owner };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployToken);
    _owner = fixture.owner;
    _token = fixture.token;
    _otherAccount = fixture.otherAccount;
  });

  describe("Given transferrer does not have enough funds", function () {
    it("Should revert", async function () {
      let transferValue = ethers.parseUnits("6", 16);
      await expect(
        _token.transfer(await _token.getAddress(), transferValue)
      ).to.be.reverted;
    });
  });

  describe("Given transferrer has enough funds", function () {
    it("Should emit 'Transfer' event", async function () {
      let transferValue = ethers.parseUnits("1", 16);
      await expect(_token.transfer(_otherAccount.address, transferValue))
        .emit(_token, "Transfer")
        .withArgs(_owner.address, _otherAccount.address, transferValue);
    });
  });
});
