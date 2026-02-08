import { expect } from "chai";
import { ethers } from "hardhat";
import { parseVaultFromVaultCreatedLogs } from "../utils";
import { MockERC20, CollateralVault } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  time,
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When depositing ERC20 collateral", function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;
  const FEES_PERCENT_PRECISION = BigInt(100_000);
  const depositFeePercent = BigInt(1_000); // 1.000%

  let _vault: CollateralVault;
  let _token: MockERC20;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;
  let _beneficiary: HardhatEthersSigner;

  function computeFeesFromPercent(amount: bigint, feePercent: bigint) {
    return (amount * feePercent) / FEES_PERCENT_PRECISION;
  }

  async function deployVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount, beneficiary] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000"),
    );

    const CollateralController = await ethers.getContractFactory(
      "CollateralController",
    );
    const controller = await CollateralController.deploy();

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

    // Approve a lot of tokens to pay fees
    await token.approve(
      await rewardPool.getAddress(),
      ethers.parseEther("100000"),
    );

    await token.transfer(await rewardPool.getAddress(), ethers.parseEther("1"));
    await rewardPool.createLifetimeVault(ethers.parseEther("1"));
    await rewardPool.depositToLifetimeVault();

    // Use the token as collateral to simplify tests as it is a ERC20
    const tx = await rewardPool.createVaultWithFees(
      "CollateralVault",
      "vault-image.png",
      lockUntil,
      ethers.parseEther("10"),
      await token.getAddress(),
      BigInt(0),
      // ERC20
      ethers.parseEther("10"),
      depositFeePercent,
      BigInt(0),
      BigInt(0),
      await beneficiary.getAddress(),
    );
    const txReceipt = await tx.wait();
    const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      owner,
      vault,
      token,
      otherAccount,
      beneficiary,
    };
  }

  beforeEach(async function () {
    const { vault, token, owner, otherAccount, beneficiary } =
      await loadFixture(deployVault);

    _vault = vault;
    _token = token;

    _owner = owner;
    _otherAccount = otherAccount;
    _beneficiary = beneficiary;
  });

  describe("Given caller don't have a key", async function () {
    it("Should revert with 'NotEnoughtNFTToDeposit' error", async function () {
      await expect(
        _vault.connect(_otherAccount).deposit(),
      ).to.be.revertedWithCustomError(_vault, "NotEnoughNFTToDeposit");
    });
  });

  describe("Given caller own a key", async function () {
    beforeEach(async function () {
      _vault.approve(await _owner.getAddress(), 1);
      _vault.transferFrom(
        await _owner.getAddress(),
        await _otherAccount.getAddress(),
        1,
      );

      await _token.transfer(
        await _otherAccount.getAddress(),
        ethers.parseEther("1000"),
      );

      await _token
        .connect(_otherAccount)
        .approve(await _vault.getAddress(), await _vault.wantedAmount());
    });

    describe("But collateral is already deposited", async function () {
      beforeEach(async function () {
        await _vault.connect(_otherAccount).deposit();
      });

      it("Should revert with 'AlreadyDeposited' error", async function () {
        await expect(
          _vault.connect(_otherAccount).deposit(),
        ).to.be.revertedWithCustomError(_vault, "AlreadyDeposited");
      });
    });

    describe("But lockedUntil is reached", async function () {
      beforeEach(async function () {
        await time.increase(lockIn);
      });

      it("Should revert with 'TooLateToDeposit' error", async function () {
        await expect(
          _vault.connect(_otherAccount).deposit(),
        ).to.be.revertedWithCustomError(_vault, "TooLateToDeposit");
      });
    });

    describe("And lockedUntil is not reached and collateral is not deposited", async function () {
      it("Should emit 'Deposit' event", async function () {
        await expect(_vault.connect(_otherAccount).deposit()).to.emit(
          _vault,
          "Deposited",
        );
      });

      it("Should mark the vault as deposited", async function () {
        await _vault.connect(_otherAccount).deposit();

        expect(await _vault.isDeposited()).to.be.true;
      });

      it("Should fill the deposit timestamp", async function () {
        await _vault.connect(_otherAccount).deposit();

        expect(await _vault.depositTimestamp()).to.not.be.equal(BigInt(0));
      });

      it("Should mark the vault as rewardable", async function () {
        await _vault.connect(_otherAccount).deposit();

        expect(await _vault.isRewardable()).to.be.true;
      });

      it("Should take the collateral from the caller", async function () {
        const wantedAmount = await _vault.wantedAmount();

        const callerBalanceOfBefore = await _token.balanceOf(
          _otherAccount.address,
        );
        await _vault.connect(_otherAccount).deposit();
        const callerBalanceOfAfter = await _token.balanceOf(
          _otherAccount.address,
        );

        expect(callerBalanceOfAfter).to.be.equal(
          callerBalanceOfBefore - wantedAmount,
        );
      });

      it("Should balanceOf be wanted amount minus deposit fees in the vault", async function () {
        const wantedAmount = await _vault.wantedAmount();
        const expectedFees = computeFeesFromPercent(
          wantedAmount,
          depositFeePercent,
        );

        await _vault.connect(_otherAccount).deposit();

        expect(await _token.balanceOf(await _vault.getAddress())).to.be.equal(
          wantedAmount - expectedFees,
        );
      });

      it("Should send deposit fees to the beneficiary", async function () {
        const wantedAmount = await _vault.wantedAmount();
        const expectedFees = computeFeesFromPercent(
          wantedAmount,
          depositFeePercent,
        );
        const beneficiaryBalanceBefore = await _token.balanceOf(
          _beneficiary.address,
        );

        await _vault.connect(_otherAccount).deposit();

        const beneficiaryBalanceAfter = await _token.balanceOf(
          _beneficiary.address,
        );

        expect(beneficiaryBalanceAfter).to.be.equal(
          beneficiaryBalanceBefore + expectedFees,
        );
      });
    });
  });
});
