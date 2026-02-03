import { expect } from "chai";
import { ethers } from "hardhat";
import { parseVaultFromVaultCreatedLogs } from "../utils";
import { MockERC20, CollateralVault } from "../../typechain-types";
import {
  loadFixture,
  reset,
  time,
} from "@nomicfoundation/hardhat-network-helpers";

describe("When checking is rewardable for vault", async function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _vault: CollateralVault;
  let _token: MockERC20;

  async function deployVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000"),
    );

    const CollateralController = await ethers.getContractFactory(
      "CollateralController",
    );
    const controller = await CollateralController.deploy();

    const CollateralRewardPool = await ethers.getContractFactory(
      "CollateralRewardPool",
    );
    const rewardPool = await CollateralRewardPool.deploy(
      await owner.getAddress(),
      await controller.getAddress(),
      await token.getAddress(),
    );

    await controller.addFactory(await owner.getAddress());
    await controller.pushRewardPool(await rewardPool.getAddress());
    await controller.removeFactory(await owner.getAddress());

    await token.approve(
      await rewardPool.getAddress(),
      ethers.parseEther("100000"),
    );

    await token.transfer(await rewardPool.getAddress(), lifetimeVaultAmount);
    await rewardPool.createLifetimeVault(lifetimeVaultAmount);

    await token.transfer(await rewardPool.getAddress(), lifetimeVaultAmount);
    await rewardPool.depositToLifetimeVault();

    const tx = await rewardPool.createVault(
      "CollateralVault",
      "vault-image.png",
      lockUntil,
      ethers.parseEther("10"),
      await token.getAddress(),
      BigInt(0),
      ethers.parseEther("10"),
    );
    const txReceipt = await tx.wait();

    const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      vault,
      token,
    };
  }

  beforeEach(async function () {
    const { vault, token } = await loadFixture(deployVault);

    _vault = vault;
    _token = token;
  });

  describe("Given the collateral is not deposited", async function () {
    it("Should return false", async function () {
      expect(await _vault.isRewardable()).to.be.false;
    });
  });

  describe("Given the collateral is withdrawn", async function () {
    beforeEach(async function () {
      await _token.approve(
        await _vault.getAddress(),
        await _vault.wantedAmount(),
      );

      await _vault.deposit();
      await _vault.withdraw();
    });

    it("Should return false", async function () {
      expect(await _vault.isRewardable()).to.be.false;
    });
  });

  describe("Given the locked period is over", async function () {
    beforeEach(async function () {
      await _token.approve(
        await _vault.getAddress(),
        await _vault.wantedAmount(),
      );

      await _vault.deposit();

      await time.increase(lockIn + 1);
    });

    it("Should return false", async function () {
      expect(await _vault.isRewardable()).to.be.false;
    });
  });

  describe("Given the collateral is not deposited, not withdrawn and the locked period is not over", async function () {
    beforeEach(async function () {
      await _token.approve(
        await _vault.getAddress(),
        await _vault.wantedAmount(),
      );

      await _vault.deposit();
    });

    it("Should return true", async function () {
      expect(await _vault.isRewardable()).to.be.true;
    });
  });
});
