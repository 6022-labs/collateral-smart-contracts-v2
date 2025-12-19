import { expect } from "chai";
import { ethers } from "hardhat";
import { parseRewardPoolLifetimeVaultFromVaultCreatedLogs } from "../utils";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  RewardPool6022,
  RewardPoolLifetimeVault6022,
  MockERC20,
} from "../../typechain-types";

describe("When checking is rewardable for reward pool lifetime vault", async function () {
  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token6022: MockERC20;
  let _rewardPool6022: RewardPool6022;
  let _rewardPoolLifetimeVault: RewardPoolLifetimeVault6022;

  async function deployRewardPoolLifetimeVault() {
    await reset();

    const [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token6022 = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    // Didn't deploy the RewardPoolFactory6022
    // In order to test the deposit (RewardPoolFactory6022 directly calls the deposit method)
    const RewardPool6022 = await ethers.getContractFactory("RewardPool6022");
    const rewardPool6022 = await RewardPool6022.deploy(
      await owner.getAddress(),
      await controller6022.getAddress(),
      await token6022.getAddress()
    );

    await controller6022.addFactory(await owner.getAddress());
    await controller6022.pushRewardPool(await rewardPool6022.getAddress());
    await controller6022.removeFactory(await owner.getAddress());

    // Create the lifetime vault using the RewardPool6022
    await token6022.transfer(
      await rewardPool6022.getAddress(),
      lifetimeVaultAmount
    );

    const tx = await rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
    const txReceipt = await tx.wait();
    // But don't use the depositToLifetimeVault method yet (to test not deposited case)

    const rewardPoolLifetimeVault =
      await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      token6022,
      rewardPool6022,
      rewardPoolLifetimeVault,
    };
  }

  beforeEach(async function () {
    const { token6022, rewardPool6022, rewardPoolLifetimeVault } =
      await loadFixture(deployRewardPoolLifetimeVault);

    _token6022 = token6022;
    _rewardPool6022 = rewardPool6022;
    _rewardPoolLifetimeVault = rewardPoolLifetimeVault;
  });

  describe("Given the collateral is not deposited", async function () {
    it("Should return false", async function () {
      expect(await _rewardPoolLifetimeVault.isRewardable()).to.be.false;
    });
  });

  describe("Given the collateral is withdrawn", async function () {
    beforeEach(async function () {
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool6022.depositToLifetimeVault();
      await _rewardPoolLifetimeVault.withdraw();
    });

    it("Should return false", async function () {
      expect(await _rewardPoolLifetimeVault.isRewardable()).to.be.false;
    });
  });

  describe("Given the collateral is deposited and not withdrawn", async function () {
    beforeEach(async function () {
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool6022.depositToLifetimeVault();
    });

    it("Should return true", async function () {
      expect(await _rewardPoolLifetimeVault.isRewardable()).to.be.true;
    });
  });
});
