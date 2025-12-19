import { expect } from "chai";
import { ethers } from "hardhat";
import {
  createDepositedVault,
  getRewardableVaults,
  parseRewardPoolFromRewardPoolCreatedLogs,
} from "../utils";
import { RewardPool6022, MockERC20, Vault6022 } from "../../typechain-types";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When reinvesting reward", function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token6022: MockERC20;
  let _rewardPool6022: RewardPool6022;

  async function deployRewardPool() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token6022 = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const RewardPoolFactory6022 = await ethers.getContractFactory(
      "RewardPoolFactory6022"
    );
    const rewardPoolFactory6022 = await RewardPoolFactory6022.deploy(
      await controller6022.getAddress(),
      await token6022.getAddress()
    );

    await controller6022.addFactory(await rewardPoolFactory6022.getAddress());

    await token6022.approve(
      await rewardPoolFactory6022.getAddress(),
      lifetimeVaultAmount
    );

    const tx = await rewardPoolFactory6022.createRewardPool(
      lifetimeVaultAmount
    );
    const txReceipt = await tx.wait();

    const rewardPool6022 = await parseRewardPoolFromRewardPoolCreatedLogs(
      txReceipt!.logs
    );

    return { token6022, rewardPool6022 };
  }

  beforeEach(async function () {
    const { token6022, rewardPool6022 } = await loadFixture(deployRewardPool);

    _token6022 = token6022;
    _rewardPool6022 = rewardPool6022;
  });

  describe("Given the caller is not register as a vault", function () {
    it("Should revert with 'CallerNotVault' error", async function () {
      await expect(
        _rewardPool6022.reinvestRewards()
      ).to.revertedWithCustomError(_rewardPool6022, "CallerNotVault");
    });
  });

  describe("Given the caller is register as a vault", function () {
    let _vault: Vault6022;

    beforeEach(async function () {
      const vaultWantedAmountEther = ethers.parseEther("1");

      _vault = await createDepositedVault(
        _token6022,
        _rewardPool6022,
        lockedUntil,
        vaultWantedAmountEther
      );
    });

    describe("And there is no rewards to reinvest", function () {
      it("Should emit 'Reinvested' event", async function () {
        await expect(_vault.withdraw())
          .to.emit(_rewardPool6022, "Reinvested")
          .withArgs(await _vault.getAddress(), 0);
      });
    });

    describe("And there is rewards to reinvest", function () {
      beforeEach(async function () {
        // Create new vaults to generate rewards
        for (let i = 0; i < 2; i++) {
          let wantedAmount = ethers.parseEther((Math.random() * 10).toString());

          _vault = await createDepositedVault(
            _token6022,
            _rewardPool6022,
            lockedUntil,
            wantedAmount
          );
        }
      });

      it("Should emit 'Reinvested' event", async function () {
        const collectedRewards = await _rewardPool6022.collectedRewards(
          await _vault.getAddress()
        );

        await expect(_vault.withdraw())
          .to.emit(_rewardPool6022, "Reinvested")
          .withArgs(await _vault.getAddress(), collectedRewards);
      });

      it("Should increase collected rewards of rewardable vaults", async function () {
        const collectedRewardsThatWillBeReinvested =
          await _rewardPool6022.collectedRewards(await _vault.getAddress());

        const rewardableVaults = await getRewardableVaults(_rewardPool6022);

        let currentVaultAddress = await _vault.getAddress();
        const rewardableVaultsWithoutCurrentVault = rewardableVaults.filter(
          (x) => x != currentVaultAddress
        );

        let collectedRewardsBefore: { [key: string]: bigint } = {};
        let vaultRewardWeights: { [key: string]: bigint } = {};
        let totalVaultRewardWeight = BigInt(0);

        for (let element of rewardableVaultsWithoutCurrentVault) {
          collectedRewardsBefore[element] =
            await _rewardPool6022.collectedRewards(element);

          const rewardWeight = await _rewardPool6022.vaultsRewardWeight(
            element
          );
          vaultRewardWeights[element] = rewardWeight;
          totalVaultRewardWeight += rewardWeight;
        }

        await _vault.withdraw();

        for (let element of rewardableVaultsWithoutCurrentVault) {
          let collectedRewardsAfter = await _rewardPool6022.collectedRewards(
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
