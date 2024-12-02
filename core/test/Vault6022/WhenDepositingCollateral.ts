import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { Token6022, Vault6022 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  time,
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When depositing collateral", function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  let _vault6022: Vault6022;
  let _token6022: Token6022;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const RewardPool6022 = await ethers.getContractFactory("RewardPool6022");
    const rewardPool6022 = await RewardPool6022.deploy(
      await owner.getAddress(),
      await controller6022.getAddress(),
      await token6022.getAddress()
    );

    await controller6022.addFactory(await owner.getAddress());
    await controller6022.pushRewardPool(await rewardPool6022.getAddress());
    await controller6022.removeFactory(await owner.getAddress());

    await token6022.approve(
      await rewardPool6022.getAddress(),
      ethers.parseEther("100000")
    );

    await token6022.transfer(
      await rewardPool6022.getAddress(),
      ethers.parseEther("1")
    );
    await rewardPool6022.createLifetimeVault(ethers.parseEther("1"));

    const tx = await rewardPool6022.createVault(
      "Vault6022",
      lockUntil,
      ethers.parseEther("10"),
      await token6022.getAddress(),
      BigInt(0),
      ethers.parseEther("10")
    );

    const txReceipt = await tx.wait();

    const events = <EventLog[]>(
      txReceipt?.logs.filter((x) => x instanceof EventLog)
    );
    const vaultCreatedEvent = events.filter(
      (x) =>
        x.fragment.name === rewardPool6022.filters["VaultCreated(address)"].name
    )[0];

    const Vault6022 = await ethers.getContractFactory("Vault6022");
    const vault6022 = Vault6022.attach(vaultCreatedEvent.args[0]) as Vault6022;

    return {
      owner,
      vault6022,
      token6022,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const { vault6022, token6022, owner, otherAccount } =
      await loadFixture(deployVault);

    _vault6022 = vault6022;
    _token6022 = token6022;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given caller don't have a key", async function () {
    it("Should revert with 'NotEnoughtNFTToDeposit' error", async function () {
      await expect(
        _vault6022.connect(_otherAccount).deposit()
      ).to.be.revertedWithCustomError(_vault6022, "NotEnoughNFTToDeposit");
    });
  });

  describe("Given caller own a key", async function () {
    let _vault6022Runner: Vault6022;

    beforeEach(async function () {
      _vault6022.approve(await _owner.getAddress(), 1);
      _vault6022.transferFrom(
        await _owner.getAddress(),
        await _otherAccount.getAddress(),
        1
      );

      await _token6022.transfer(
        await _otherAccount.getAddress(),
        ethers.parseEther("1000")
      );

      await _token6022
        .connect(_otherAccount)
        .approve(
          await _vault6022.getAddress(),
          await _vault6022.wantedAmount()
        );

      _vault6022Runner = _vault6022.connect(_otherAccount);
    });

    describe("But collateral is already deposited", async function () {
      beforeEach(async function () {
        await _vault6022Runner.deposit();
      });

      it("Should revert with 'AlreadyDeposited' event", async function () {
        await expect(_vault6022Runner.deposit()).to.be.revertedWithCustomError(
          _vault6022,
          "AlreadyDeposited"
        );
      });
    });

    describe("But lockedUntil is reached", async function () {
      beforeEach(async function () {
        await time.increase(lockIn);
      });

      it("Should revert with 'TooLateToDeposit' error", async function () {
        await expect(
          _vault6022.connect(_otherAccount).deposit()
        ).to.be.revertedWithCustomError(_vault6022, "TooLateToDeposit");
      });
    });

    describe("And lockedUntil is not reached and collateral is not deposited", async function () {
      it("Should emit 'Deposit' event", async function () {
        await expect(_vault6022.connect(_otherAccount).deposit()).to.emit(
          _vault6022,
          "Deposited"
        );
      });
    });
  });
});
