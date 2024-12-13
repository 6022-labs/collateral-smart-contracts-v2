import { expect } from "chai";
import { ethers } from "hardhat";
import { RewardPool6022, Token6022, Vault6022 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  createDepositedVault,
  parseRewardPoolFromRewardPoolCreatedLogs,
} from "../utils";
import {
  time,
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When harvesting rewards", function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token6022: Token6022;
  let _rewardPool6022: RewardPool6022;

  let _owner: HardhatEthersSigner;

  async function deployRewardPool() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(
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

    const tx =
      await rewardPoolFactory6022.createRewardPool(lifetimeVaultAmount);
    const txReceipt = await tx.wait();

    const rewardPool6022 = await parseRewardPoolFromRewardPoolCreatedLogs(
      txReceipt!.logs
    );

    return {
      token6022,
      rewardPool6022,
      owner,
    };
  }

  beforeEach(async function () {
    const { token6022, rewardPool6022, owner } =
      await loadFixture(deployRewardPool);

    _owner = owner;
    _token6022 = token6022;
    _rewardPool6022 = rewardPool6022;
  });

  describe("Given caller is not register as a vault", function () {
    it("Should revert with 'CallerNotVault' error", async function () {
      await expect(
        _rewardPool6022.harvestRewards(await _owner.getAddress())
      ).to.revertedWithCustomError(_rewardPool6022, "CallerNotVault");
    });
  });

  describe("Given caller is register as a vault", function () {
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

    describe("And there is no rewards to harvest", function () {
      beforeEach(async function () {
        await time.increase(lockedDuring);
      });

      it("Should emit 'Harvested' event", async function () {
        await expect(_vault.withdraw())
          .to.emit(_rewardPool6022, "Harvested")
          .withArgs(await _vault.getAddress(), 0);
      });

      it("Should not increase the caller balance", async function () {
        const balanceBefore = await _token6022.balanceOf(_owner.address);

        // Value in the collateral will increase the caller balance as we must withdraw the contract
        const valueInCollateral = await _vault.wantedAmount();

        await _vault.withdraw();
        const balanceAfter = await _token6022.balanceOf(_owner.address);

        expect(balanceAfter).to.be.equal(balanceBefore + valueInCollateral);
      });
    });

    describe("And there is rewards to harvest", function () {
      beforeEach(async function () {
        for (let i = 0; i < 2; i++) {
          // Create new vaults to generate rewards
          const vaultWantedAmountEther = ethers.parseEther("1");

          await createDepositedVault(
            _token6022,
            _rewardPool6022,
            lockedUntil,
            vaultWantedAmountEther
          );
        }

        await time.increase(lockedDuring);
      });

      it("Should emit 'Harvested' event", async function () {
        const collectedRewards = await _rewardPool6022.collectedRewards(
          await _vault.getAddress()
        );

        await expect(_vault.withdraw())
          .to.emit(_rewardPool6022, "Harvested")
          .withArgs(await _vault.getAddress(), collectedRewards);
      });

      it("Should increase caller balance", async function () {
        const balanceBefore = await _token6022.balanceOf(_owner.address);
        const collectedRewards = await _rewardPool6022.collectedRewards(
          await _vault.getAddress()
        );

        // Value in the collateral will increase the caller balance as we must withdraw the contract
        const valueInCollateral = await _vault.wantedAmount();

        await _vault.withdraw();
        const balanceAfter = await _token6022.balanceOf(_owner.address);

        expect(balanceAfter).to.be.equal(
          balanceBefore + valueInCollateral + collectedRewards
        );
      });
    });
  });
});
