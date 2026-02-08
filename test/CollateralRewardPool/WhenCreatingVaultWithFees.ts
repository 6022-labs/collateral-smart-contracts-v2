import { expect } from "chai";
import { ethers } from "hardhat";
import { CollateralRewardPool, MockERC20 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  computeFeesFromCollateral,
  parseVaultFromVaultCreatedLogs,
} from "../utils";
import {
  reset,
  time,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When creating vault with fees from reward pool 6022", function () {
  const lockedDuring = 60 * 60 * 24;
  const lifetimeVaultAmount = ethers.parseEther("1");
  const wantedAmountInTheVault = ethers.parseEther("1");

  let _token: MockERC20;
  let _rewardPool: CollateralRewardPool;
  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;
  let _beneficiary: HardhatEthersSigner;

  async function deployRewardPool() {
    await reset();

    const [owner, otherAccount, beneficiary] = await ethers.getSigners();

    const CollateralController = await ethers.getContractFactory(
      "CollateralController",
    );
    const controller = await CollateralController.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000"),
    );

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

    return { token, rewardPool, owner, otherAccount, beneficiary };
  }

  async function prepareRewardableLifetimeVault() {
    await _token.transfer(await _rewardPool.getAddress(), lifetimeVaultAmount);
    await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
    await _rewardPool.depositToLifetimeVault();
  }

  async function createVaultWithFees(
    wantedTokenAddress: string,
    storageType: bigint,
    backedValueProtocolToken: bigint,
    depositFeePercent: bigint,
    withdrawEarlyFeePercent: bigint,
    withdrawLateFeePercent: bigint,
    feeBeneficiary: string,
  ) {
    const lockedUntil = (await time.latest()) + lockedDuring;

    return _rewardPool.createVaultWithFees(
      "TestVault",
      "vault-image.png",
      lockedUntil,
      wantedAmountInTheVault,
      wantedTokenAddress,
      storageType,
      backedValueProtocolToken,
      depositFeePercent,
      withdrawEarlyFeePercent,
      withdrawLateFeePercent,
      feeBeneficiary,
    );
  }

  beforeEach(async function () {
    const { token, rewardPool, owner, otherAccount, beneficiary } =
      await loadFixture(deployRewardPool);

    _token = token;
    _rewardPool = rewardPool;
    _owner = owner;
    _otherAccount = otherAccount;
    _beneficiary = beneficiary;
  });

  describe("Given caller is not the owner", async function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      await expect(
        _rewardPool
          .connect(_otherAccount)
          .createVaultWithFees(
            "TestVault",
            "vault-image.png",
            (await time.latest()) + lockedDuring,
            wantedAmountInTheVault,
            await _rewardPool.protocolToken(),
            BigInt(0),
            wantedAmountInTheVault,
            BigInt(0),
            BigInt(0),
            BigInt(0),
            ethers.ZeroAddress,
          ),
      ).to.revertedWithCustomError(_rewardPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Given reward pool lifetime vault is not initialized", async function () {
    it("Should revert with 'LifeTimeVaultDoesNotExist' error", async function () {
      await expect(
        createVaultWithFees(
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
          BigInt(0),
          BigInt(0),
          BigInt(0),
          ethers.ZeroAddress,
        ),
      ).to.revertedWithCustomError(_rewardPool, "LifeTimeVaultDoesNotExist");
    });
  });

  describe("Given reward pool lifetime vault is not rewardable", async function () {
    beforeEach(async function () {
      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount,
      );
      await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
    });

    it("Should revert with 'LifeTimeVaultIsNotRewardable' error", async function () {
      await expect(
        createVaultWithFees(
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
          BigInt(0),
          BigInt(0),
          BigInt(0),
          ethers.ZeroAddress,
        ),
      ).to.revertedWithCustomError(_rewardPool, "LifeTimeVaultIsNotRewardable");
    });
  });

  describe("Given caller didn't approve the token to be spend", async function () {
    beforeEach(async function () {
      await prepareRewardableLifetimeVault();
    });

    it("Should revert with 'ERC20InsufficientAllowance' error", async function () {
      await expect(
        createVaultWithFees(
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
          BigInt(0),
          BigInt(0),
          BigInt(0),
          ethers.ZeroAddress,
        ),
      ).to.be.revertedWithCustomError(_token, "ERC20InsufficientAllowance");
    });
  });

  describe("Given a too short locked until", async function () {
    beforeEach(async function () {
      await prepareRewardableLifetimeVault();
      await _token.approve(
        await _rewardPool.getAddress(),
        wantedAmountInTheVault,
      );
    });

    it("Should revert with a 'LockedUntilTooShort' error", async function () {
      await expect(
        _rewardPool.createVaultWithFees(
          "TestVault",
          "vault-image.png",
          await time.latest(),
          wantedAmountInTheVault,
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
          BigInt(0),
          BigInt(0),
          BigInt(0),
          ethers.ZeroAddress,
        ),
      ).to.be.revertedWithCustomError(_rewardPool, "LockedUntilTooShort()");
    });
  });

  describe("Given a too high deposit fee percent", async function () {
    beforeEach(async function () {
      await prepareRewardableLifetimeVault();
      await _token.approve(
        await _rewardPool.getAddress(),
        wantedAmountInTheVault,
      );
    });

    it("Should revert with a 'InvalidFeePercent' error", async function () {
      const CollateralVault = await ethers.getContractFactory(
        "CollateralVault",
      );

      await expect(
        createVaultWithFees(
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
          BigInt(100_001),
          BigInt(0),
          BigInt(0),
          _beneficiary.address,
        ),
      ).to.be.revertedWithCustomError(CollateralVault, "InvalidFeePercent");
    });
  });

  describe("Given a too high withdraw early fee percent", async function () {
    beforeEach(async function () {
      await prepareRewardableLifetimeVault();
      await _token.approve(
        await _rewardPool.getAddress(),
        wantedAmountInTheVault,
      );
    });

    it("Should revert with a 'InvalidFeePercent' error", async function () {
      const CollateralVault = await ethers.getContractFactory(
        "CollateralVault",
      );

      await expect(
        createVaultWithFees(
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
          BigInt(0),
          BigInt(100_001),
          BigInt(0),
          _beneficiary.address,
        ),
      ).to.be.revertedWithCustomError(CollateralVault, "InvalidFeePercent");
    });
  });

  describe("Given a too high withdraw late fee percent", async function () {
    beforeEach(async function () {
      await prepareRewardableLifetimeVault();
      await _token.approve(
        await _rewardPool.getAddress(),
        wantedAmountInTheVault,
      );
    });

    it("Should revert with a 'InvalidFeePercent' error", async function () {
      const CollateralVault = await ethers.getContractFactory(
        "CollateralVault",
      );

      await expect(
        createVaultWithFees(
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
          BigInt(0),
          BigInt(0),
          BigInt(100_001),
          _beneficiary.address,
        ),
      ).to.be.revertedWithCustomError(CollateralVault, "InvalidFeePercent");
    });
  });

  describe("Given a fee percent is set but wanted token is ERC721", async function () {
    beforeEach(async function () {
      await prepareRewardableLifetimeVault();
      await _token.approve(
        await _rewardPool.getAddress(),
        wantedAmountInTheVault,
      );
    });

    it("Should revert with a 'FeesNotSupportedForERC721Collateral' error", async function () {
      const CollateralVault = await ethers.getContractFactory(
        "CollateralVault",
      );

      await expect(
        createVaultWithFees(
          ethers.ZeroAddress,
          BigInt(1),
          wantedAmountInTheVault,
          BigInt(1000),
          BigInt(0),
          BigInt(0),
          _beneficiary.address,
        ),
      ).to.be.revertedWithCustomError(
        CollateralVault,
        "FeesNotSupportedForERC721Collateral",
      );
    });
  });

  describe("Given caller is owner, approved token and lifetime vault is rewardable", async function () {
    beforeEach(async function () {
      await prepareRewardableLifetimeVault();
      await _token.approve(
        await _rewardPool.getAddress(),
        wantedAmountInTheVault,
      );
    });

    it("Should emit 'VaultCreated' event", async function () {
      await expect(
        createVaultWithFees(
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
          BigInt(1000),
          BigInt(2000),
          BigInt(3000),
          _beneficiary.address,
        ),
      ).to.emit(_rewardPool, "VaultCreated");
    });

    it("Should store custom collateral fee parameters in the vault", async function () {
      const tx = await createVaultWithFees(
        await _rewardPool.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault,
        BigInt(1000), // 1.000%
        BigInt(2000), // 2.000%
        BigInt(3000), // 3.000%
        _beneficiary.address,
      );
      const txReceipt = await tx.wait();
      const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await vault.depositFeePercent()).to.equal(BigInt(1000));
      expect(await vault.withdrawEarlyFeePercent()).to.equal(BigInt(2000));
      expect(await vault.withdrawLateFeePercent()).to.equal(BigInt(3000));
      expect(await vault.feeBeneficiary()).to.equal(_beneficiary.address);
    });

    it("Should set fee beneficiary to creator when parameter is zero address", async function () {
      const tx = await createVaultWithFees(
        await _rewardPool.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault,
        BigInt(1), // 0.001%
        BigInt(0),
        BigInt(0),
        ethers.ZeroAddress,
      );
      const txReceipt = await tx.wait();
      const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await vault.feeBeneficiary()).to.equal(_owner.address);
      expect(await vault.depositFeePercent()).to.equal(BigInt(1));
    });

    it("Should pay protocol fees according to backed value when wanted token is not protocol token", async function () {
      const backedValueProtocolToken = BigInt(10);
      const expectedFees = computeFeesFromCollateral(backedValueProtocolToken);

      const callerBalanceOfBefore = await _token.balanceOf(_owner.address);
      const rewardPoolBalanceOfBefore = await _token.balanceOf(
        await _rewardPool.getAddress(),
      );

      await createVaultWithFees(
        ethers.ZeroAddress,
        BigInt(0),
        backedValueProtocolToken,
        BigInt(1000),
        BigInt(2000),
        BigInt(3000),
        _beneficiary.address,
      );

      const callerBalanceOfAfter = await _token.balanceOf(_owner.address);
      const rewardPoolBalanceOfAfter = await _token.balanceOf(
        await _rewardPool.getAddress(),
      );

      expect(callerBalanceOfAfter).to.equal(
        callerBalanceOfBefore - expectedFees,
      );
      expect(rewardPoolBalanceOfAfter).to.equal(
        rewardPoolBalanceOfBefore + expectedFees,
      );
    });

    it("Should pay protocol fees according to wanted amount when wanted token is protocol token", async function () {
      const expectedFees = computeFeesFromCollateral(wantedAmountInTheVault);

      const callerBalanceOfBefore = await _token.balanceOf(_owner.address);
      const rewardPoolBalanceOfBefore = await _token.balanceOf(
        await _rewardPool.getAddress(),
      );

      await createVaultWithFees(
        await _rewardPool.protocolToken(),
        BigInt(0),
        BigInt(0), // Will be overridden by wanted amount in reward pool
        BigInt(1000),
        BigInt(2000),
        BigInt(3000),
        _beneficiary.address,
      );

      const callerBalanceOfAfter = await _token.balanceOf(_owner.address);
      const rewardPoolBalanceOfAfter = await _token.balanceOf(
        await _rewardPool.getAddress(),
      );

      expect(callerBalanceOfAfter).to.equal(
        callerBalanceOfBefore - expectedFees,
      );
      expect(rewardPoolBalanceOfAfter).to.equal(
        rewardPoolBalanceOfBefore + expectedFees,
      );
    });
  });
});
