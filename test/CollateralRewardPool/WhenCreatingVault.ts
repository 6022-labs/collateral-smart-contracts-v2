import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  MockERC20,
  CollateralVault,
  CollateralRewardPool,
} from "../../typechain-types";
import {
  getRewardableVaults,
  createDepositedVault,
  computeFeesFromCollateral,
  parseVaultFromVaultCreatedLogs,
  rewardPoolTotalCollectedRewards,
} from "../utils";

describe("When creating vault from reward pool 6022", function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  const lifetimeVaultAmount = ethers.parseEther("1");
  const wantedAmountInTheVault = ethers.parseEther("1");

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

  describe("Given caller is not the owner", async function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      await expect(
        _rewardPool
          .connect(_otherAccount)
          .createVault(
            "TestVault",
            "vault-image.png",
            lockedUntil,
            wantedAmountInTheVault,
            await _rewardPool.protocolToken(),
            BigInt(0),
            wantedAmountInTheVault,
          ),
      ).to.revertedWithCustomError(_rewardPool, "OwnableUnauthorizedAccount");
    });
  });

  describe("Given reward pool lifetime vault is not initialized", async function () {
    it("Should revert with 'LifeTimeVaultDoesNotExist' error", async function () {
      await expect(
        _rewardPool.createVault(
          "TestVault",
          "vault-image.png",
          lockedUntil,
          wantedAmountInTheVault,
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
        ),
      ).to.revertedWithCustomError(_rewardPool, "LifeTimeVaultDoesNotExist");
    });
  });

  // Lifetime vault must be rewardable to have at least one vault that can collect fees
  describe("Given reward pool lifetime vault is not rewardable", async function () {
    beforeEach(async function () {
      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount,
      );

      // Create the lifetime vault but don't deposit the collateral (not rewardable)
      await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
    });

    it("Should revert with 'LifeTimeVaultIsNotRewardable' error", async function () {
      await expect(
        _rewardPool.createVault(
          "TestVault",
          "vault-image.png",
          lockedUntil,
          wantedAmountInTheVault,
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
        ),
      ).to.revertedWithCustomError(_rewardPool, "LifeTimeVaultIsNotRewardable");
    });
  });

  describe("Given caller didn't approve the token to be spend", async function () {
    beforeEach(async function () {
      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount,
      );
      await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
      await _rewardPool.depositToLifetimeVault();
    });

    it("Should revert with 'ERC20InsufficientAllowance' error", async function () {
      await expect(
        _rewardPool.createVault(
          "TestVault",
          "vault-image.png",
          lockedUntil,
          wantedAmountInTheVault,
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
        ),
      ).to.be.revertedWithCustomError(_token, "ERC20InsufficientAllowance");
    });
  });

  describe("Given a too short locked until", async function () {
    beforeEach(async function () {
      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount,
      );
      await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
      await _rewardPool.depositToLifetimeVault();

      await _token.approve(
        await _rewardPool.getAddress(),
        wantedAmountInTheVault,
      );
    });

    it("Should revert with a 'LockedUntilTooShort' error", async function () {
      const lockedUntil = Math.floor(Date.now() / 1000);

      await expect(
        _rewardPool.createVault(
          "TestVault",
          "vault-image.png",
          lockedUntil,
          wantedAmountInTheVault,
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
        ),
      ).to.be.revertedWithCustomError(_rewardPool, "LockedUntilTooShort()");
    });
  });

  describe("Given caller is owner, approve the token to be spend and lifetime vault is rewardable", async function () {
    beforeEach(async function () {
      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount,
      );
      await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
      await _rewardPool.depositToLifetimeVault();

      await _token.approve(
        await _rewardPool.getAddress(),
        wantedAmountInTheVault,
      );
    });

    it("Should emit 'VaultCreated' event", async function () {
      await expect(
        _rewardPool.createVault(
          "TestVault",
          "vault-image.png",
          lockedUntil,
          wantedAmountInTheVault,
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
        ),
      ).to.emit(_rewardPool, "VaultCreated");
    });

    it("Should increase reward weight", async function () {
      await _rewardPool.createVault(
        "TestVault",
        "vault-image.png",
        lockedUntil,
        wantedAmountInTheVault,
        await _rewardPool.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault,
      );

      const vaultAddress = await _rewardPool.allVaults(1);

      expect(
        await _rewardPool.vaultsRewardWeight(vaultAddress),
      ).to.be.greaterThan(0);
    });

    it("Should pay fees to the pool", async function () {
      const callerBalanceOfBefore = await _token.balanceOf(_owner.address);
      const rewardPoolBalanceOfBefore = await _token.balanceOf(
        await _rewardPool.getAddress(),
      );

      await _rewardPool.createVault(
        "TestVault",
        "vault-image.png",
        lockedUntil,
        wantedAmountInTheVault,
        await _rewardPool.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault,
      );

      const callerBalanceOfAfter = await _token.balanceOf(_owner.address);
      const rewardPoolBalanceOfAfter = await _token.balanceOf(
        await _rewardPool.getAddress(),
      );

      const expectedFees = computeFeesFromCollateral(wantedAmountInTheVault);

      expect(callerBalanceOfAfter).to.be.equal(
        callerBalanceOfBefore - expectedFees,
      );
      expect(rewardPoolBalanceOfAfter).to.be.equal(
        rewardPoolBalanceOfBefore + expectedFees,
      );
    });

    it("Should send the keys of the vault to the caller (owner)", async function () {
      const tx = await _rewardPool.createVault(
        "TestVault",
        "vault-image.png",
        lockedUntil,
        wantedAmountInTheVault,
        await _rewardPool.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault,
      );
      const txReceipt = await tx.wait();

      const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await vault.balanceOf(_owner.address)).to.be.equal(3);
    });

    it("Should create the vault as non rewardable", async function () {
      const tx = await _rewardPool.createVault(
        "TestVault",
        "vault-image.png",
        lockedUntil,
        wantedAmountInTheVault,
        await _rewardPool.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault,
      );
      const txReceipt = await tx.wait();

      const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await vault.isRewardable()).to.be.false;
    });

    it("Should mark the vault as non deposited", async function () {
      const tx = await _rewardPool.createVault(
        "TestVault",
        "vault-image.png",
        lockedUntil,
        wantedAmountInTheVault,
        await _rewardPool.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault,
      );
      const txReceipt = await tx.wait();

      const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await vault.isDeposited()).to.be.false;
    });

    it("Should set default collateral fees to zero and beneficiary to creator", async function () {
      const tx = await _rewardPool.createVault(
        "TestVault",
        "vault-image.png",
        lockedUntil,
        wantedAmountInTheVault,
        await _rewardPool.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault,
      );
      const txReceipt = await tx.wait();

      const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await vault.depositFeePercent()).to.equal(0);
      expect(await vault.withdrawEarlyFeePercent()).to.equal(0);
      expect(await vault.withdrawLateFeePercent()).to.equal(0);
      expect(await vault.feeBeneficiary()).to.equal(_owner.address);
    });

    describe("And there is only the lifetime vault as rewardable vault", async function () {
      it("Should set all the fees to the lifetime vault", async function () {
        const lifetimeVaultAddress = await _rewardPool.lifetimeVault();

        const lifetimeVaultCollectedRewardsBefore =
          await _rewardPool.collectedRewards(lifetimeVaultAddress);
        await _rewardPool.createVault(
          "TestVault",
          "vault-image.png",
          lockedUntil,
          wantedAmountInTheVault,
          await _rewardPool.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault,
        );

        const lifetimeVaultCollectedRewardsAfter =
          await _rewardPool.collectedRewards(lifetimeVaultAddress);

        const expectedFees = computeFeesFromCollateral(wantedAmountInTheVault);

        expect(lifetimeVaultCollectedRewardsAfter).to.be.equal(
          lifetimeVaultCollectedRewardsBefore + expectedFees,
        );
      });
    });

    describe("And there is not enough fees for every rewardable pools", async function () {
      beforeEach(async function () {
        let vaultToCreate = Math.floor(Math.random() * 10) + 1;

        for (let index = 0; index < vaultToCreate; index++) {
          const vaultAmount = Math.floor(Math.random() * 100) + 1;
          const vaultAmountBigInt = ethers.parseEther(vaultAmount.toString());

          await createDepositedVault(
            _token,
            _rewardPool,
            lockedUntil,
            vaultAmountBigInt,
          );
        }
      });

      it("Should not be more rewards than the balance", async function () {
        await _rewardPool.createVault(
          "TestVault",
          "vault-image.png",
          lockedUntil,
          BigInt(50),
          // To have 1$ fees (2%)
          await _rewardPool.protocolToken(),
          BigInt(0),
          BigInt(50), // To have 1$ fees (2%)
        );

        const totalCollectedRewards = await rewardPoolTotalCollectedRewards(
          _rewardPool,
        );
        const rewardPoolBalanceOf = await _token.balanceOf(
          await _rewardPool.getAddress(),
        );

        expect(totalCollectedRewards).to.be.lessThanOrEqual(
          rewardPoolBalanceOf,
        );
      });

      it("Should pay the oldest vaults firsts", async function () {
        const lifetimeVaultCollectedRewardsBefore =
          await _rewardPool.collectedRewards(await _rewardPool.allVaults(0));

        const firstVaultCollectedRewardsBefore =
          await _rewardPool.collectedRewards(await _rewardPool.allVaults(1));

        await _rewardPool.createVault(
          "TestVault",
          "vault-image.png",
          lockedUntil,
          BigInt(100), // To have 2$ fees (2%)
          await _rewardPool.protocolToken(),
          BigInt(0),
          BigInt(100), // To have 2$ fees (2%)
        );

        const lifetimeVaultCollectedRewardsAfter =
          await _rewardPool.collectedRewards(await _rewardPool.allVaults(0));

        const firstVaultCollectedRewardsAfter =
          await _rewardPool.collectedRewards(await _rewardPool.allVaults(1));

        expect(lifetimeVaultCollectedRewardsAfter).to.be.equal(
          lifetimeVaultCollectedRewardsBefore + BigInt(1),
        );
        expect(firstVaultCollectedRewardsAfter).to.be.equal(
          firstVaultCollectedRewardsBefore + BigInt(1),
        );
      });
    });

    describe("And there is enough fees for every rewardable pools", async function () {
      let _rewardableVaults: CollateralVault[] = [];

      beforeEach(async function () {
        let vaultToCreate = Math.floor(Math.random() * 10) + 1;

        for (let index = 0; index < vaultToCreate; index++) {
          const vaultAmount = Math.floor(Math.random() * 100) + 1;
          const vaultAmountBigInt = ethers.parseEther(vaultAmount.toString());

          const vault = await createDepositedVault(
            _token,
            _rewardPool,
            lockedUntil,
            vaultAmountBigInt,
          );
          _rewardableVaults.push(vault);
        }
      });

      it("Should pay fees according to reward weight", async function () {
        const vaultAmount = ethers.parseEther("1000");
        const expectedFees = computeFeesFromCollateral(vaultAmount);

        let totalRewardWeight: bigint = BigInt(0);

        let rewardableVaults = await getRewardableVaults(_rewardPool);
        let rewardableVaultsInfos: {
          weight: bigint;
          address: string;
          collectedRewardsBefore: bigint;
          expectedCollectRewardsAfter: bigint | null;
        }[] = [];

        for (let rewardableVault of rewardableVaults) {
          const collectedRewardsBefore = await _rewardPool.collectedRewards(
            rewardableVault,
          );
          const weight = await _rewardPool.vaultsRewardWeight(rewardableVault);

          rewardableVaultsInfos.push({
            weight,
            collectedRewardsBefore,
            address: rewardableVault,
            expectedCollectRewardsAfter: null,
          });

          totalRewardWeight += weight;
        }

        for (let rewardableVaultInfo of rewardableVaultsInfos) {
          rewardableVaultInfo.expectedCollectRewardsAfter =
            rewardableVaultInfo.collectedRewardsBefore +
            (expectedFees * rewardableVaultInfo.weight) / totalRewardWeight;
        }

        await _token.approve(await _rewardPool.getAddress(), vaultAmount);

        await _rewardPool.createVault(
          "TestVault",
          "vault-image.png",
          lockedUntil,
          vaultAmount,
          await _rewardPool.protocolToken(),
          BigInt(0),
          vaultAmount,
        );

        for (let rewardableVault of rewardableVaultsInfos) {
          const collectedRewardsAfter = await _rewardPool.collectedRewards(
            rewardableVault.address,
          );

          expect(collectedRewardsAfter).to.be.equal(
            rewardableVault.expectedCollectRewardsAfter!,
          );
        }
      });
    });

    describe("And wanted token is not protocol token", async function () {
      it("Should pay fees according to backed value to the pool", async function () {
        const backedValueProtocolToken = BigInt(10);

        const callerBalanceOfBefore = await _token.balanceOf(_owner.address);
        const rewardPoolBalanceOfBefore = await _token.balanceOf(
          await _rewardPool.getAddress(),
        );

        await _rewardPool.createVault(
          "TestVault",
          "vault-image.png",
          lockedUntil,
          wantedAmountInTheVault,
          ethers.ZeroAddress, // Put any address you want, just must not be the _token address
          BigInt(0),
          backedValueProtocolToken,
        );

        const callerBalanceOfAfter = await _token.balanceOf(_owner.address);
        const rewardPoolBalanceOfAfter = await _token.balanceOf(
          await _rewardPool.getAddress(),
        );

        const expectedFees = computeFeesFromCollateral(
          backedValueProtocolToken,
        );

        expect(callerBalanceOfAfter).to.be.equal(
          callerBalanceOfBefore - expectedFees,
        );
        expect(rewardPoolBalanceOfAfter).to.be.equal(
          rewardPoolBalanceOfBefore + expectedFees,
        );
      });
    });

    describe("And wanted token is protocol token", async function () {
      describe("But caller put a different amount between backed value and wanted token", async function () {
        it("Should pay fees according to wanted amount to the pool", async function () {
          const callerBalanceOfBefore = await _token.balanceOf(_owner.address);
          const rewardPoolBalanceOfBefore = await _token.balanceOf(
            await _rewardPool.getAddress(),
          );

          await _rewardPool.createVault(
            "TestVault",
            "vault-image.png",
            lockedUntil,
            wantedAmountInTheVault,
            await _rewardPool.protocolToken(),
            BigInt(0),
            BigInt(0), // Here we put another value than "wantedAmountInTheVault"
          );

          const callerBalanceOfAfter = await _token.balanceOf(_owner.address);
          const rewardPoolBalanceOfAfter = await _token.balanceOf(
            await _rewardPool.getAddress(),
          );

          const expectedFees = computeFeesFromCollateral(
            wantedAmountInTheVault,
          );

          expect(callerBalanceOfAfter).to.be.equal(
            callerBalanceOfBefore - expectedFees,
          );
          expect(rewardPoolBalanceOfAfter).to.be.equal(
            rewardPoolBalanceOfBefore + expectedFees,
          );
        });
      });

      describe("But caller put same amount between backed value and wanted token", async function () {
        it("Should pay fees according to backed value to the pool", async function () {
          const callerBalanceOfBefore = await _token.balanceOf(_owner.address);
          const rewardPoolBalanceOfBefore = await _token.balanceOf(
            await _rewardPool.getAddress(),
          );

          await _rewardPool.createVault(
            "TestVault",
            "vault-image.png",
            lockedUntil,
            wantedAmountInTheVault,
            await _rewardPool.protocolToken(),
            BigInt(0),
            wantedAmountInTheVault, // Here we put the same value as wanted token
          );

          const callerBalanceOfAfter = await _token.balanceOf(_owner.address);
          const rewardPoolBalanceOfAfter = await _token.balanceOf(
            await _rewardPool.getAddress(),
          );

          const expectedFees = computeFeesFromCollateral(
            wantedAmountInTheVault,
          );

          expect(callerBalanceOfAfter).to.be.equal(
            callerBalanceOfBefore - expectedFees,
          );
          expect(rewardPoolBalanceOfAfter).to.be.equal(
            rewardPoolBalanceOfBefore + expectedFees,
          );
        });
      });
    });
  });
});
