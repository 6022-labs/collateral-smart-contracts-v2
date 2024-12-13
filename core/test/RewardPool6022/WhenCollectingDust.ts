import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  Token6022,
  Vault6022,
  RewardPool6022,
  RewardPoolLifetimeVault6022,
} from "../../typechain-types";
import {
  time,
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import {
  createDepositedVault,
  rewardPoolRemainingRewards,
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
} from "../utils";

describe("When collecting dust from reward pool", async function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token6022: Token6022;
  let _rewardPool6022: RewardPool6022;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployRewardPool() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    // Deploy directly a RewardPool6022 instead of using a RewardPoolFactory6022
    // To be able to test more case (RewardPoolFactory6022 automatically create the lifetime vault...)
    const RewardPool6022 = await ethers.getContractFactory("RewardPool6022");
    const rewardPool6022 = await RewardPool6022.deploy(
      await owner.getAddress(),
      await controller6022.getAddress(),
      await token6022.getAddress()
    );

    await controller6022.addFactory(await owner.getAddress());
    await controller6022.pushRewardPool(await rewardPool6022.getAddress());
    await controller6022.removeFactory(await owner.getAddress());

    return { token6022, rewardPool6022, owner, otherAccount };
  }

  beforeEach(async function () {
    const { token6022, rewardPool6022, owner, otherAccount } =
      await loadFixture(deployRewardPool);

    _token6022 = token6022;
    _rewardPool6022 = rewardPool6022;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given caller is not the owner", function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      await expect(
        _rewardPool6022.connect(_otherAccount).collectDust()
      ).to.be.revertedWithCustomError(
        _rewardPool6022,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Given lifetime vault is not created", async function () {
    it("Should revert with 'LifeTimeVaultDoesNotExist' error", async function () {
      await expect(_rewardPool6022.collectDust()).to.be.revertedWithCustomError(
        _rewardPool6022,
        "LifeTimeVaultDoesNotExist"
      );
    });
  });

  describe("Given lifetime vault is rewardable", async function () {
    beforeEach(async function () {
      await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool6022.depositToLifetimeVault();
    });

    it("Should revert with 'LifeTimeVaultIsRewardable' error", async function () {
      await expect(_rewardPool6022.collectDust()).to.be.revertedWithCustomError(
        _rewardPool6022,
        "LifeTimeVaultIsRewardable"
      );
    });
  });

  describe("Given no dust to collect", async function () {
    let _lifetimeVault: RewardPoolLifetimeVault6022;

    beforeEach(async function () {
      // Take a amount that will not create dust with the computed fees for the lifetime vault
      const lifetimeVaultAmount = ethers.parseEther("1.02");

      const tx = await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
      const txReceipt = await tx.wait();
      _lifetimeVault = await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(
        txReceipt!.logs
      );

      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool6022.depositToLifetimeVault();

      // Withdraw the lifetime vault to be able to collect dust
      await _lifetimeVault.withdraw();
    });

    it("Should revert with 'NoDustToCollect' error", async function () {
      await expect(_rewardPool6022.collectDust()).to.be.revertedWithCustomError(
        _rewardPool6022,
        "NoDustToCollect"
      );
    });
  });

  describe("Given called by owner, lifetime vault is not rewardable and their is dust in the pool", async function () {
    let _createdVaults: Vault6022[] = [];
    let _lifetimeVault: RewardPoolLifetimeVault6022;

    beforeEach(async function () {
      const tx = await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
      const txReceipt = await tx.wait();
      _lifetimeVault = await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(
        txReceipt!.logs
      );

      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool6022.depositToLifetimeVault();

      // Create a lot of vaults to create dust
      const numberOfVaults = Math.floor(Math.random() * 30) + 1;

      for (let index = 0; index < numberOfVaults; index++) {
        const vaultWantedAmount = Math.floor(Math.random() * 100) + 1;
        const vaultWantedAmountEther = ethers.parseEther(
          vaultWantedAmount.toString()
        );

        await _token6022.approve(
          await _rewardPool6022.getAddress(),
          vaultWantedAmountEther
        );

        const vault = await createDepositedVault(
          _token6022,
          _rewardPool6022,
          lockedUntil,
          vaultWantedAmountEther
        );

        _createdVaults.push(vault);
      }

      await time.increase(lockedDuring);

      // Withdraw the lifetime vault to be able to collect dust
      await _lifetimeVault.withdraw();
    });

    // This test is flaky due to the randomness of the number of vaults created + the randomness of the wanted amount of each vault
    it("Should emit 'DustCollected' event", async function () {
      await expect(_rewardPool6022.collectDust()).to.emit(
        _rewardPool6022,
        "DustCollected"
      );
    });

    // Even if the lifetime vault has been withdrawn, some vaults that are not anymore rewardable can still be withdrawn.
    // We must keep those rewards into the pool (in order to harvest them when the vaults will be withdrawn).
    it("Should let the remaining rewards in the pool", async function () {
      const totalRemainingRewards =
        await rewardPoolRemainingRewards(_rewardPool6022);

      await _rewardPool6022.collectDust();

      expect(
        await _token6022.balanceOf(await _rewardPool6022.getAddress())
      ).to.be.equal(totalRemainingRewards);
    });

    it("Should transfer the dust to the caller", async function () {
      const totalRemainingRewards =
        await rewardPoolRemainingRewards(_rewardPool6022);
      const rewardPoolBalanceOfBefore = await _token6022.balanceOf(
        await _rewardPool6022.getAddress()
      );

      const dust = rewardPoolBalanceOfBefore - totalRemainingRewards;

      // Expect that there is dust inside the reward pool
      expect(dust).to.not.be.equal(0);

      const callerBalanceOfBefore = await _token6022.balanceOf(
        await _owner.getAddress()
      );

      await _rewardPool6022.collectDust();

      expect(await _token6022.balanceOf(await _owner.getAddress())).to.be.equal(
        callerBalanceOfBefore + dust
      );
    });
  });
});
