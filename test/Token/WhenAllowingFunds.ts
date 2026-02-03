import { expect } from "chai";
import { ethers } from "hardhat";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { MockERC20 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("When allowing funds of token 6022", function () {
  const totalSupply = ethers.parseUnits("5", 16);

  let _token: MockERC20;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployToken() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(await owner.getAddress(), totalSupply);

    return { token, otherAccount, owner };
  }

  beforeEach(async function () {
    const fixture = await loadFixture(deployToken);
    _owner = fixture.owner;
    _token = fixture.token;
    _otherAccount = fixture.otherAccount;
  });

  it("Should allow funds", async function () {
    // Approve 50 tokens from owner to otherAccount
    await _token.approve(_otherAccount.address, 50);

    // Check balances
    const balance = await _token.allowance(
      _owner.address,
      _otherAccount.address,
    );

    expect(balance).to.equal(50);
  });
});
