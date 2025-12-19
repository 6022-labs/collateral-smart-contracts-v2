import { expect } from "chai";
import { ethers } from "hardhat";
import { parseVaultFromVaultCreatedLogs } from "../utils";
import { MockERC20, Vault6022 } from "../../typechain-types";
import {
  loadFixture,
  reset,
  time,
} from "@nomicfoundation/hardhat-network-helpers";

describe("When checking is rewardable for vault", async function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _vault6022: Vault6022;
  let _token6022: MockERC20;

  async function deployVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token6022 = await MockERC20.deploy(
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
      lifetimeVaultAmount
    );
    await rewardPool6022.createLifetimeVault(lifetimeVaultAmount);

    await token6022.transfer(
      await rewardPool6022.getAddress(),
      lifetimeVaultAmount
    );
    await rewardPool6022.depositToLifetimeVault();

    const tx = await rewardPool6022.createVault(
      "Vault6022",
      lockUntil,
      ethers.parseEther("10"),
      await token6022.getAddress(),
      BigInt(0),
      ethers.parseEther("10")
    );
    const txReceipt = await tx.wait();

    const vault6022 = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      vault6022,
      token6022,
    };
  }

  beforeEach(async function () {
    const { vault6022, token6022 } = await loadFixture(deployVault);

    _vault6022 = vault6022;
    _token6022 = token6022;
  });

  describe("Given the collateral is not deposited", async function () {
    it("Should return false", async function () {
      expect(await _vault6022.isRewardable()).to.be.false;
    });
  });

  describe("Given the collateral is withdrawn", async function () {
    beforeEach(async function () {
      await _token6022.approve(
        await _vault6022.getAddress(),
        await _vault6022.wantedAmount()
      );

      await _vault6022.deposit();
      await _vault6022.withdraw();
    });

    it("Should return false", async function () {
      expect(await _vault6022.isRewardable()).to.be.false;
    });
  });

  describe("Given the locked period is over", async function () {
    beforeEach(async function () {
      await _token6022.approve(
        await _vault6022.getAddress(),
        await _vault6022.wantedAmount()
      );

      await _vault6022.deposit();

      await time.increase(lockIn + 1);
    });

    it("Should return false", async function () {
      expect(await _vault6022.isRewardable()).to.be.false;
    });
  });

  describe("Given the collateral is not deposited, not withdrawn and the locked period is not over", async function () {
    beforeEach(async function () {
      await _token6022.approve(
        await _vault6022.getAddress(),
        await _vault6022.wantedAmount()
      );

      await _vault6022.deposit();
    });

    it("Should return true", async function () {
      expect(await _vault6022.isRewardable()).to.be.true;
    });
  });
});
