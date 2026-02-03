import { expect } from "chai";
import { ethers } from "hardhat";
import { parseRewardPoolLifetimeVaultFromVaultCreatedLogs } from "../utils";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  MockERC20,
  RewardPool,
  RewardPoolLifetimeVault,
} from "../../typechain-types";

describe("When checking is rewardable for reward pool lifetime vault", async function () {
  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token: MockERC20;
  let _rewardPool: RewardPool;
  let _rewardPoolLifetimeVault: RewardPoolLifetimeVault;

  async function deployRewardPoolLifetimeVault() {
    await reset();

    const [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const Controller = await ethers.getContractFactory("Controller");
    const controller = await Controller.deploy();

    // Didn't deploy the RewardPoolFactory
    // In order to test the deposit (RewardPoolFactory directly calls the deposit method)
    const RewardPool = await ethers.getContractFactory("RewardPool");
    const rewardPool = await RewardPool.deploy(
      await owner.getAddress(),
      await controller.getAddress(),
      await token.getAddress()
    );

    await controller.addFactory(await owner.getAddress());
    await controller.pushRewardPool(await rewardPool.getAddress());
    await controller.removeFactory(await owner.getAddress());

    // Create the lifetime vault using the RewardPool
    await token.transfer(
      await rewardPool.getAddress(),
      lifetimeVaultAmount
    );

    const tx = await rewardPool.createLifetimeVault(lifetimeVaultAmount);
    const txReceipt = await tx.wait();
    // But don't use the depositToLifetimeVault method yet (to test not deposited case)

    const rewardPoolLifetimeVault =
      await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      token,
      rewardPool,
      rewardPoolLifetimeVault,
    };
  }

  beforeEach(async function () {
    const { token, rewardPool, rewardPoolLifetimeVault } =
      await loadFixture(deployRewardPoolLifetimeVault);

    _token = token;
    _rewardPool = rewardPool;
    _rewardPoolLifetimeVault = rewardPoolLifetimeVault;
  });

  describe("Given the collateral is not deposited", async function () {
    it("Should return false", async function () {
      expect(await _rewardPoolLifetimeVault.isRewardable()).to.be.false;
    });
  });

  describe("Given the collateral is withdrawn", async function () {
    beforeEach(async function () {
      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool.depositToLifetimeVault();
      await _rewardPoolLifetimeVault.withdraw();
    });

    it("Should return false", async function () {
      expect(await _rewardPoolLifetimeVault.isRewardable()).to.be.false;
    });
  });

  describe("Given the collateral is deposited and not withdrawn", async function () {
    beforeEach(async function () {
      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool.depositToLifetimeVault();
    });

    it("Should return true", async function () {
      expect(await _rewardPoolLifetimeVault.isRewardable()).to.be.true;
    });
  });
});
