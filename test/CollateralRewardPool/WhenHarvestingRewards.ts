import { expect } from "chai";
import { ethers } from "hardhat";
import {
  CollateralRewardPool,
  MockERC20,
  CollateralVault,
} from "../../typechain-types";
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

  let _token: MockERC20;
  let _rewardPool: CollateralRewardPool;

  let _owner: HardhatEthersSigner;

  async function deployRewardPool() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const CollateralController = await ethers.getContractFactory(
      "CollateralController",
    );
    const controller = await CollateralController.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000"),
    );

    const CollateralRewardPoolFactory = await ethers.getContractFactory(
      "CollateralRewardPoolFactory",
    );
    const rewardPoolFactory = await CollateralRewardPoolFactory.deploy(
      await controller.getAddress(),
      await token.getAddress(),
    );

    await controller.addFactory(await rewardPoolFactory.getAddress());

    await token.approve(
      await rewardPoolFactory.getAddress(),
      lifetimeVaultAmount,
    );

    const tx = await rewardPoolFactory.createRewardPool(lifetimeVaultAmount);
    const txReceipt = await tx.wait();

    const rewardPool = await parseRewardPoolFromRewardPoolCreatedLogs(
      txReceipt!.logs,
    );

    return {
      token,
      rewardPool,
      owner,
    };
  }

  beforeEach(async function () {
    const { token, rewardPool, owner } = await loadFixture(deployRewardPool);

    _owner = owner;
    _token = token;
    _rewardPool = rewardPool;
  });

  describe("Given caller is not register as a vault", function () {
    it("Should revert with 'CallerNotVault' error", async function () {
      await expect(
        _rewardPool.harvestRewards(await _owner.getAddress()),
      ).to.revertedWithCustomError(_rewardPool, "CallerNotVault");
    });
  });

  describe("Given caller is register as a vault", function () {
    let _vault: CollateralVault;

    beforeEach(async function () {
      const vaultWantedAmountEther = ethers.parseEther("1");

      _vault = await createDepositedVault(
        _token,
        _rewardPool,
        lockedUntil,
        vaultWantedAmountEther,
      );
    });

    describe("And there is no rewards to harvest", function () {
      beforeEach(async function () {
        await time.increase(lockedDuring + 1);
      });

      it("Should emit 'Harvested' event", async function () {
        await expect(_vault.withdraw())
          .to.emit(_rewardPool, "Harvested")
          .withArgs(await _vault.getAddress(), 0);
      });

      it("Should not increase the caller balance", async function () {
        const balanceBefore = await _token.balanceOf(_owner.address);

        // Value in the collateral will increase the caller balance as we must withdraw the contract
        const valueInCollateral = await _vault.wantedAmount();

        await _vault.withdraw();
        const balanceAfter = await _token.balanceOf(_owner.address);

        expect(balanceAfter).to.be.equal(balanceBefore + valueInCollateral);
      });
    });

    describe("And there is rewards to harvest", function () {
      beforeEach(async function () {
        for (let i = 0; i < 2; i++) {
          // Create new vaults to generate rewards
          const vaultWantedAmountEther = ethers.parseEther("1");

          await createDepositedVault(
            _token,
            _rewardPool,
            lockedUntil,
            vaultWantedAmountEther,
          );
        }

        await time.increase(lockedDuring);
      });

      it("Should emit 'Harvested' event", async function () {
        const collectedRewards = await _rewardPool.collectedRewards(
          await _vault.getAddress(),
        );

        await expect(_vault.withdraw())
          .to.emit(_rewardPool, "Harvested")
          .withArgs(await _vault.getAddress(), collectedRewards);
      });

      it("Should increase caller balance", async function () {
        const balanceBefore = await _token.balanceOf(_owner.address);
        const collectedRewards = await _rewardPool.collectedRewards(
          await _vault.getAddress(),
        );

        // Value in the collateral will increase the caller balance as we must withdraw the contract
        const valueInCollateral = await _vault.wantedAmount();

        await _vault.withdraw();
        const balanceAfter = await _token.balanceOf(_owner.address);

        expect(balanceAfter).to.be.equal(
          balanceBefore + valueInCollateral + collectedRewards,
        );
      });
    });
  });
});
