import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  createDepositedVault,
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
} from "../utils";
import {
  MockERC20,
  CollateralRewardPool,
  CollateralRewardPoolLifetimeVault,
} from "../../typechain-types";

describe("When withdrawing collateral from reward pool lifetime vault", async function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  let _token: MockERC20;
  let _rewardPool: CollateralRewardPool;
  let _rewardPoolLifetimeVault: CollateralRewardPoolLifetimeVault;

  async function deployRewardPoolLifetimeVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const CollateralController = await ethers.getContractFactory("CollateralController");
    const controller = await CollateralController.deploy();

    // Didn't deploy the CollateralRewardPoolFactory
    // In order to test the deposit (CollateralRewardPoolFactory directly calls the deposit method)
    const CollateralRewardPool = await ethers.getContractFactory("CollateralRewardPool");
    const rewardPool = await CollateralRewardPool.deploy(
      await owner.getAddress(),
      await controller.getAddress(),
      await token.getAddress()
    );

    await controller.addFactory(await owner.getAddress());
    await controller.pushRewardPool(await rewardPool.getAddress());
    await controller.removeFactory(await owner.getAddress());

    // Create the lifetime vault using the CollateralRewardPool
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
      owner,
      token,
      otherAccount,
      rewardPool,
      rewardPoolLifetimeVault,
    };
  }

  beforeEach(async function () {
    const {
      owner,
      token,
      otherAccount,
      rewardPool,
      rewardPoolLifetimeVault,
    } = await loadFixture(deployRewardPoolLifetimeVault);

    _owner = owner;
    _token = token;
    _otherAccount = otherAccount;
    _rewardPool = rewardPool;
    _rewardPoolLifetimeVault = rewardPoolLifetimeVault;
  });

  describe("Given caller is not the owner", async function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      await expect(
        _rewardPoolLifetimeVault.connect(_otherAccount).withdraw()
      ).to.be.revertedWithCustomError(
        _rewardPoolLifetimeVault,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Given collateral is not deposited", async function () {
    it("Should revert with 'NotDeposited' error", async function () {
      await expect(
        _rewardPoolLifetimeVault.withdraw()
      ).to.be.revertedWithCustomError(_rewardPoolLifetimeVault, "NotDeposited");
    });
  });

  describe("Given collateral is deposited", async function () {
    beforeEach(async function () {
      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount
      );

      await _rewardPool.depositToLifetimeVault();
    });

    describe("But collateral is already withdrawn", async function () {
      beforeEach(async function () {
        await _rewardPoolLifetimeVault.withdraw();
      });

      it("Should revert with 'AlreadyWithdrawn' error", async function () {
        await expect(
          _rewardPoolLifetimeVault.withdraw()
        ).to.be.revertedWithCustomError(
          _rewardPoolLifetimeVault,
          "AlreadyWithdrawn"
        );
      });
    });

    // Because if their is a rewardable vault, it can call the "reinvestRewards" without vault to collect fees
    describe("But still rewardable vaults in the reward pool", async function () {
      const wantedAmountInTheVault = ethers.parseEther("1");

      beforeEach(async function () {
        await createDepositedVault(
          _token,
          _rewardPool,
          lockedUntil,
          wantedAmountInTheVault
        );
      });

      it("Should revert with 'RemainingRewardableVaults' error", async function () {
        await expect(
          _rewardPoolLifetimeVault.withdraw()
        ).to.be.revertedWithCustomError(
          _rewardPoolLifetimeVault,
          "RemainingRewardableVaults"
        );
      });
    });

    describe("And can be withdrawn", async function () {
      beforeEach(async function () {
        // Create some vaults to increase the rewards of the lifetime vault
        const wantedVaults = Math.floor(Math.random() * 4) + 2;

        await _token.approve(
          await _rewardPool.getAddress(),
          ethers.parseEther("100")
        );

        // Just create some withdrawn vaults
        for (let index = 0; index < wantedVaults; index++) {
          const vault = await createDepositedVault(
            _token,
            _rewardPool,
            lockedUntil,
            ethers.parseEther("1")
          );

          await vault.withdraw();
        }
      });

      it("Should emit 'Withdrawn' event", async function () {
        await expect(_rewardPoolLifetimeVault.withdraw()).to.emit(
          _rewardPoolLifetimeVault,
          "Withdrawn"
        );
      });

      it("Should emit 'Harvested' event", async function () {
        await expect(_rewardPoolLifetimeVault.withdraw()).to.emit(
          _rewardPool,
          "Harvested"
        );
      });

      it("Should send the collateral and collected rewards to the caller", async function () {
        const balanceOfVaultBefore = await _token.balanceOf(
          await _rewardPoolLifetimeVault.getAddress()
        );
        const rewardsOfLifetimeVaultBefore =
          await _rewardPool.collectedRewards(
            await _rewardPoolLifetimeVault.getAddress()
          );

        const balanceCallerBefore = await _token.balanceOf(_owner.address);
        await _rewardPoolLifetimeVault.withdraw();
        const balanceCallerAfter = await _token.balanceOf(_owner.address);

        expect(balanceCallerAfter).to.be.equal(
          balanceOfVaultBefore +
            balanceCallerBefore +
            rewardsOfLifetimeVaultBefore
        );
      });

      it("Should be no more collateral in the vault", async function () {
        await _rewardPoolLifetimeVault.withdraw();

        expect(
          await _token.balanceOf(
            await _rewardPoolLifetimeVault.getAddress()
          )
        ).to.be.equal(BigInt(0));
      });

      it("Should mark the vault as withdrawn", async function () {
        await _rewardPoolLifetimeVault.withdraw();

        expect(await _rewardPoolLifetimeVault.isWithdrawn()).to.be.true;
      });

      it("Should mark the vault as not rewardable", async function () {
        await _rewardPoolLifetimeVault.withdraw();

        expect(await _rewardPoolLifetimeVault.isRewardable()).to.be.false;
      });
    });
  });
});
