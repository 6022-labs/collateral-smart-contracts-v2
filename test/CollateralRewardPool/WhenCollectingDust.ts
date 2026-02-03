import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  MockERC20,
  CollateralVault,
  CollateralRewardPool,
  CollateralRewardPoolLifetimeVault,
} from "../../typechain-types";
import {
  time,
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import {
  createDepositedVault,
  rewardPoolTotalCollectedRewards,
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
} from "../utils";

describe("When collecting dust from reward pool", async function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token: MockERC20;
  let _rewardPool: CollateralRewardPool;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployRewardPool() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const CollateralController = await ethers.getContractFactory(
      "CollateralController",
    );
    const controller = await CollateralController.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000"),
    );

    // Deploy directly a CollateralRewardPool instead of using a CollateralRewardPoolFactory
    // To be able to test more case (CollateralRewardPoolFactory automatically create the lifetime vault...)
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

    return { token, rewardPool, owner, otherAccount };
  }

  beforeEach(async function () {
    const { token, rewardPool, owner, otherAccount } = await loadFixture(
      deployRewardPool,
    );

    _token = token;
    _rewardPool = rewardPool;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given caller is not the owner", function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      await expect(
        _rewardPool.connect(_otherAccount).collectDust(),
      ).to.be.revertedWithCustomError(
        _rewardPool,
        "OwnableUnauthorizedAccount",
      );
    });
  });

  describe("Given lifetime vault is not created", async function () {
    it("Should revert with 'LifeTimeVaultDoesNotExist' error", async function () {
      await expect(_rewardPool.collectDust()).to.be.revertedWithCustomError(
        _rewardPool,
        "LifeTimeVaultDoesNotExist",
      );
    });
  });

  describe("Given lifetime vault is rewardable", async function () {
    beforeEach(async function () {
      await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount,
      );
      await _rewardPool.depositToLifetimeVault();
    });

    it("Should revert with 'LifeTimeVaultIsRewardable' error", async function () {
      await expect(_rewardPool.collectDust()).to.be.revertedWithCustomError(
        _rewardPool,
        "LifeTimeVaultIsRewardable",
      );
    });
  });

  describe("Given no dust to collect", async function () {
    let _lifetimeVault: CollateralRewardPoolLifetimeVault;

    beforeEach(async function () {
      // Take a amount that will not create dust with the computed fees for the lifetime vault
      const lifetimeVaultAmount = ethers.parseEther("1.02");

      const tx = await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
      const txReceipt = await tx.wait();
      _lifetimeVault = await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(
        txReceipt!.logs,
      );

      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount,
      );
      await _rewardPool.depositToLifetimeVault();

      // Withdraw the lifetime vault to be able to collect dust
      await _lifetimeVault.withdraw();
    });

    it("Should revert with 'NoDustToCollect' error", async function () {
      await expect(_rewardPool.collectDust()).to.be.revertedWithCustomError(
        _rewardPool,
        "NoDustToCollect",
      );
    });
  });

  describe("Given called by owner, lifetime vault is not rewardable and their is dust in the pool", async function () {
    let _createdVaults: CollateralVault[] = [];
    let _lifetimeVault: CollateralRewardPoolLifetimeVault;

    beforeEach(async function () {
      const tx = await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
      const txReceipt = await tx.wait();
      _lifetimeVault = await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(
        txReceipt!.logs,
      );

      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount,
      );
      await _rewardPool.depositToLifetimeVault();

      // Create a lot of vaults to create dust
      const numberOfVaults = Math.floor(Math.random() * 30) + 1;

      for (let index = 0; index < numberOfVaults; index++) {
        const vaultWantedAmount = Math.floor(Math.random() * 100) + 1;
        const vaultWantedAmountEther = ethers.parseEther(
          vaultWantedAmount.toString(),
        );

        const vault = await createDepositedVault(
          _token,
          _rewardPool,
          lockedUntil,
          vaultWantedAmountEther,
        );

        _createdVaults.push(vault);
      }

      await time.increase(lockedDuring);

      // Withdraw the lifetime vault to be able to collect dust
      await _lifetimeVault.withdraw();
    });

    // This test is flaky due to the randomness of the number of vaults created + the randomness of the wanted amount of each vault
    it("Should emit 'DustCollected' event", async function () {
      await expect(_rewardPool.collectDust()).to.emit(
        _rewardPool,
        "DustCollected",
      );
    });

    // Even if the lifetime vault has been withdrawn, some vaults that are not anymore rewardable can still be withdrawn.
    // We must keep those rewards into the pool (in order to harvest them when the vaults will be withdrawn).
    it("Should let the remaining rewards in the pool", async function () {
      const totalRemainingRewards = await rewardPoolTotalCollectedRewards(
        _rewardPool,
      );

      await _rewardPool.collectDust();

      expect(
        await _token.balanceOf(await _rewardPool.getAddress()),
      ).to.be.equal(totalRemainingRewards);
    });

    it("Should transfer the dust to the caller", async function () {
      const totalRemainingRewards = await rewardPoolTotalCollectedRewards(
        _rewardPool,
      );
      const rewardPoolBalanceOfBefore = await _token.balanceOf(
        await _rewardPool.getAddress(),
      );

      const dust = rewardPoolBalanceOfBefore - totalRemainingRewards;

      // Expect that there is dust inside the reward pool
      expect(dust).to.not.be.equal(0);

      const callerBalanceOfBefore = await _token.balanceOf(
        await _owner.getAddress(),
      );

      await _rewardPool.collectDust();

      expect(await _token.balanceOf(await _owner.getAddress())).to.be.equal(
        callerBalanceOfBefore + dust,
      );
    });
  });
});
