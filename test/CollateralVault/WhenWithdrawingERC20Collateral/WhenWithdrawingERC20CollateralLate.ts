import { expect } from "chai";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  lockIn,
  depositCollateral,
  deployDefaultVault,
  deployVaultWithFees,
  giveNFTsToOtherAccount,
  computeFeesFromPercent,
  ERC20WithdrawTestSuite,
  defaultWithdrawLateFeePercent,
} from "./common";

describe("When withdrawing ERC20 collateral late", function () {
  let suite: ERC20WithdrawTestSuite;

  describe("Given collateral is deposited and lockedUntil is reached", async function () {
    beforeEach(async function () {
      suite = await deployDefaultVault();
      await depositCollateral(suite);
      await time.increase(lockIn);
    });

    describe("And caller holds 2 NFT", async function () {
      beforeEach(async function () {
        await giveNFTsToOtherAccount(suite, [1, 2]);
      });

      it("Should emit 'Withdrawn' event", async function () {
        await expect(
          suite.vault.connect(suite.otherAccount).withdraw(),
        ).to.emit(suite.vault, "Withdrawn");
      });

      it("Should emit 'Harvested' event", async function () {
        await expect(
          suite.vault.connect(suite.otherAccount).withdraw(),
        ).to.emit(suite.rewardPool, "Harvested");
      });

      it("Should mark the vault as withdrawn", async function () {
        await suite.vault.connect(suite.otherAccount).withdraw();

        expect(await suite.vault.isWithdrawn()).to.be.true;
      });

      it("Should mark the vault as not rewardable", async function () {
        await suite.vault.connect(suite.otherAccount).withdraw();

        expect(await suite.vault.isRewardable()).to.be.false;
      });

      it("Should be no more collateral in the vault", async function () {
        await suite.vault.connect(suite.otherAccount).withdraw();

        expect(
          await suite.token.balanceOf(await suite.vault.getAddress()),
        ).to.be.equal(0);
      });

      it("Should withdraw remaining balance minus late fees to the caller", async function () {
        const vaultBalanceOfBefore = await suite.token.balanceOf(
          await suite.vault.getAddress(),
        );
        const callerBalanceBefore = await suite.token.balanceOf(
          suite.otherAccount.address,
        );

        await suite.vault.connect(suite.otherAccount).withdraw();

        const callerBalanceAfter = await suite.token.balanceOf(
          suite.otherAccount.address,
        );
        const expectedFees = computeFeesFromPercent(
          vaultBalanceOfBefore,
          defaultWithdrawLateFeePercent,
        );

        expect(callerBalanceAfter).to.be.equal(
          callerBalanceBefore + vaultBalanceOfBefore - expectedFees,
        );
      });

      it("Should send withdraw late fees to the beneficiary", async function () {
        const vaultBalanceOfBefore = await suite.token.balanceOf(
          await suite.vault.getAddress(),
        );
        const beneficiaryBalanceBefore = await suite.token.balanceOf(
          suite.beneficiary.address,
        );
        const expectedFees = computeFeesFromPercent(
          vaultBalanceOfBefore,
          defaultWithdrawLateFeePercent,
        );

        await suite.vault.connect(suite.otherAccount).withdraw();

        const beneficiaryBalanceAfter = await suite.token.balanceOf(
          suite.beneficiary.address,
        );
        expect(beneficiaryBalanceAfter).to.be.equal(
          beneficiaryBalanceBefore + expectedFees,
        );
      });
    });

    describe("And caller holds 1 NFT", async function () {
      beforeEach(async function () {
        await giveNFTsToOtherAccount(suite, [1]);
      });

      it("Should emit 'Withdrawn' event", async function () {
        await expect(
          suite.vault.connect(suite.otherAccount).withdraw(),
        ).to.emit(suite.vault, "Withdrawn");
      });

      it("Should emit 'Harvested' event", async function () {
        await expect(
          suite.vault.connect(suite.otherAccount).withdraw(),
        ).to.emit(suite.rewardPool, "Harvested");
      });

      it("Should mark the vault as withdrawn", async function () {
        await suite.vault.connect(suite.otherAccount).withdraw();

        expect(await suite.vault.isWithdrawn()).to.be.true;
      });

      it("Should mark the vault as not rewardable", async function () {
        await suite.vault.connect(suite.otherAccount).withdraw();

        expect(await suite.vault.isRewardable()).to.be.false;
      });

      it("Should be no more collateral in the vault", async function () {
        await suite.vault.connect(suite.otherAccount).withdraw();

        expect(
          await suite.token.balanceOf(await suite.vault.getAddress()),
        ).to.be.equal(0);
      });

      it("Should withdraw remaining balance minus late fees to the caller", async function () {
        const vaultBalanceOfBefore = await suite.token.balanceOf(
          await suite.vault.getAddress(),
        );
        const callerBalanceBefore = await suite.token.balanceOf(
          suite.otherAccount.address,
        );

        await suite.vault.connect(suite.otherAccount).withdraw();

        const callerBalanceAfter = await suite.token.balanceOf(
          suite.otherAccount.address,
        );
        const expectedFees = computeFeesFromPercent(
          vaultBalanceOfBefore,
          defaultWithdrawLateFeePercent,
        );

        expect(callerBalanceAfter).to.be.equal(
          callerBalanceBefore + vaultBalanceOfBefore - expectedFees,
        );
      });

      it("Should send withdraw late fees to the beneficiary", async function () {
        const vaultBalanceOfBefore = await suite.token.balanceOf(
          await suite.vault.getAddress(),
        );
        const beneficiaryBalanceBefore = await suite.token.balanceOf(
          suite.beneficiary.address,
        );
        const expectedFees = computeFeesFromPercent(
          vaultBalanceOfBefore,
          defaultWithdrawLateFeePercent,
        );

        await suite.vault.connect(suite.otherAccount).withdraw();

        const beneficiaryBalanceAfter = await suite.token.balanceOf(
          suite.beneficiary.address,
        );
        expect(beneficiaryBalanceAfter).to.be.equal(
          beneficiaryBalanceBefore + expectedFees,
        );
      });
    });

    describe("But caller doesn't have any NFT", async function () {
      it("Should revert with 'NotEnoughtNFTToWithdraw' error", async function () {
        await expect(
          suite.vault.connect(suite.otherAccount).withdraw(),
        ).to.be.revertedWithCustomError(suite.vault, "NotEnoughNFTToWithdraw");
      });
    });
  });

  describe("Given collateral is deposited with fees and lockedUntil is reached", async function () {
    const depositFeePercent = BigInt(10_000); // 10.000%
    const withdrawFeePercent = BigInt(20_000); // 20.000%

    beforeEach(async function () {
      suite = await deployVaultWithFees(
        depositFeePercent,
        withdrawFeePercent,
        withdrawFeePercent,
      );
      await depositCollateral(suite);
      await time.increase(lockIn);
      await giveNFTsToOtherAccount(suite, [1]);
    });

    it("Should compute withdraw fees from vault balance and not wanted amount", async function () {
      const wantedAmount = await suite.vault.wantedAmount();
      const vaultBalanceBefore = await suite.token.balanceOf(
        await suite.vault.getAddress(),
      );
      const callerBalanceBefore = await suite.token.balanceOf(
        suite.otherAccount.address,
      );
      const beneficiaryBalanceBefore = await suite.token.balanceOf(
        suite.beneficiary.address,
      );

      await suite.vault.connect(suite.otherAccount).withdraw();

      const callerBalanceAfter = await suite.token.balanceOf(
        suite.otherAccount.address,
      );
      const beneficiaryBalanceAfter = await suite.token.balanceOf(
        suite.beneficiary.address,
      );

      const expectedFeesFromBalance = computeFeesFromPercent(
        vaultBalanceBefore,
        withdrawFeePercent,
      );
      const expectedFeesFromWantedAmount = computeFeesFromPercent(
        wantedAmount,
        withdrawFeePercent,
      );

      expect(vaultBalanceBefore).to.not.be.equal(wantedAmount);
      expect(expectedFeesFromBalance).to.not.be.equal(
        expectedFeesFromWantedAmount,
      );

      expect(callerBalanceAfter - callerBalanceBefore).to.be.equal(
        vaultBalanceBefore - expectedFeesFromBalance,
      );
      expect(beneficiaryBalanceAfter - beneficiaryBalanceBefore).to.be.equal(
        expectedFeesFromBalance,
      );
    });
  });

  describe("Given collateral is fully taken at deposit (100% fee) and lockedUntil is reached", async function () {
    const fullFeePercent = BigInt(100_000); // 100%

    beforeEach(async function () {
      suite = await deployVaultWithFees(
        fullFeePercent,
        fullFeePercent,
        fullFeePercent,
      );
      await depositCollateral(suite);
      await time.increase(lockIn);
      await giveNFTsToOtherAccount(suite, [1]);

      expect(
        await suite.token.balanceOf(await suite.vault.getAddress()),
      ).to.be.equal(0);
    });

    it("Should send nothing to caller or beneficiary", async function () {
      const callerBalanceBefore = await suite.token.balanceOf(
        suite.otherAccount.address,
      );
      const beneficiaryBalanceBefore = await suite.token.balanceOf(
        suite.beneficiary.address,
      );

      await suite.vault.connect(suite.otherAccount).withdraw();

      const callerBalanceAfter = await suite.token.balanceOf(
        suite.otherAccount.address,
      );
      const beneficiaryBalanceAfter = await suite.token.balanceOf(
        suite.beneficiary.address,
      );

      expect(callerBalanceAfter).to.be.equal(callerBalanceBefore);
      expect(beneficiaryBalanceAfter).to.be.equal(beneficiaryBalanceBefore);
    });
  });
});
