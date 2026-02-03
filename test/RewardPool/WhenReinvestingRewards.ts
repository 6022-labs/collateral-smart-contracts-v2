import { expect } from "chai";
import { ethers } from "hardhat";
import {
  createDepositedVault,
  getRewardableVaults,
  parseRewardPoolFromRewardPoolCreatedLogs,
} from "../utils";
import { RewardPool, MockERC20, Vault } from "../../typechain-types";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When reinvesting reward", function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token: MockERC20;
  let _rewardPool: RewardPool;

  async function deployRewardPool() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const Controller = await ethers.getContractFactory("Controller");
    const controller = await Controller.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const RewardPoolFactory = await ethers.getContractFactory(
      "RewardPoolFactory"
    );
    const rewardPoolFactory = await RewardPoolFactory.deploy(
      await controller.getAddress(),
      await token.getAddress()
    );

    await controller.addFactory(await rewardPoolFactory.getAddress());

    await token.approve(
      await rewardPoolFactory.getAddress(),
      lifetimeVaultAmount
    );

    const tx = await rewardPoolFactory.createRewardPool(
      lifetimeVaultAmount
    );
    const txReceipt = await tx.wait();

    const rewardPool = await parseRewardPoolFromRewardPoolCreatedLogs(
      txReceipt!.logs
    );

    return { token, rewardPool };
  }

  beforeEach(async function () {
    const { token, rewardPool } = await loadFixture(deployRewardPool);

    _token = token;
    _rewardPool = rewardPool;
  });

  describe("Given the caller is not register as a vault", function () {
    it("Should revert with 'CallerNotVault' error", async function () {
      await expect(
        _rewardPool.reinvestRewards()
      ).to.revertedWithCustomError(_rewardPool, "CallerNotVault");
    });
  });

  describe("Given the caller is register as a vault", function () {
    let _vault: Vault;

    beforeEach(async function () {
      const vaultWantedAmountEther = ethers.parseEther("1");

      _vault = await createDepositedVault(
        _token,
        _rewardPool,
        lockedUntil,
        vaultWantedAmountEther
      );
    });

    describe("And there is no rewards to reinvest", function () {
      it("Should emit 'Reinvested' event", async function () {
        await expect(_vault.withdraw())
          .to.emit(_rewardPool, "Reinvested")
          .withArgs(await _vault.getAddress(), 0);
      });
    });

    describe("And there is rewards to reinvest", function () {
      beforeEach(async function () {
        // Create new vaults to generate rewards
        for (let i = 0; i < 2; i++) {
          let wantedAmount = ethers.parseEther((Math.random() * 10).toString());

          _vault = await createDepositedVault(
            _token,
            _rewardPool,
            lockedUntil,
            wantedAmount
          );
        }
      });

      it("Should emit 'Reinvested' event", async function () {
        const collectedRewards = await _rewardPool.collectedRewards(
          await _vault.getAddress()
        );

        await expect(_vault.withdraw())
          .to.emit(_rewardPool, "Reinvested")
          .withArgs(await _vault.getAddress(), collectedRewards);
      });

      it("Should increase collected rewards of rewardable vaults", async function () {
        const collectedRewardsThatWillBeReinvested =
          await _rewardPool.collectedRewards(await _vault.getAddress());

        const rewardableVaults = await getRewardableVaults(_rewardPool);

        let currentVaultAddress = await _vault.getAddress();
        const rewardableVaultsWithoutCurrentVault = rewardableVaults.filter(
          (x) => x != currentVaultAddress
        );

        let collectedRewardsBefore: { [key: string]: bigint } = {};
        let vaultRewardWeights: { [key: string]: bigint } = {};
        let totalVaultRewardWeight = BigInt(0);

        for (let element of rewardableVaultsWithoutCurrentVault) {
          collectedRewardsBefore[element] =
            await _rewardPool.collectedRewards(element);

          const rewardWeight = await _rewardPool.vaultsRewardWeight(
            element
          );
          vaultRewardWeights[element] = rewardWeight;
          totalVaultRewardWeight += rewardWeight;
        }

        await _vault.withdraw();

        for (let element of rewardableVaultsWithoutCurrentVault) {
          let collectedRewardsAfter = await _rewardPool.collectedRewards(
            element
          );

          let expectedCollectedRewards =
            collectedRewardsBefore[element] +
            (collectedRewardsThatWillBeReinvested *
              vaultRewardWeights[element]) /
              totalVaultRewardWeight;

          expect(collectedRewardsAfter).to.be.equal(expectedCollectedRewards);
        }
      });
    });

    // Not necessary to test again the case if there is not enough fees to reinvest for each vault
    // Those tests are already tested in "WhenCreatingVault" test suite
  });
});
