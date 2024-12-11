import { expect } from "chai";
import { ethers } from "hardhat";
import { computeFees, parseVaultFromVaultCreatedLogs } from "../utils";
import { RewardPool6022, Token6022 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When creating vault from reward pool 6022", function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  const lifetimeVaultAmount = ethers.parseEther("1");
  const wantedAmountInTheVault = ethers.parseEther("1");

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

  describe("Given caller is not the owner", async function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      await expect(
        _rewardPool6022
          .connect(_otherAccount)
          .createVault(
            "TestVault",
            lockedUntil,
            wantedAmountInTheVault,
            await _rewardPool6022.protocolToken(),
            BigInt(0),
            wantedAmountInTheVault
          )
      ).to.revertedWithCustomError(
        _rewardPool6022,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Given reward pool lifetime vault is not initialized", async function () {
    it("Should revert with 'LifeTimeVaultDoesNotExist' error", async function () {
      await expect(
        _rewardPool6022.createVault(
          "TestVault",
          lockedUntil,
          wantedAmountInTheVault,
          await _rewardPool6022.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault
        )
      ).to.revertedWithCustomError(
        _rewardPool6022,
        "LifeTimeVaultDoesNotExist"
      );
    });
  });

  // Lifetime vault must be rewardable to have at least one vault that can collect fees
  describe("Given reward pool lifetime vault is not rewardable", async function () {
    beforeEach(async function () {
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );

      // Create the lifetime vault but don't deposit the collateral (not rewardable)
      await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
    });

    it("Should revert with 'LifeTimeVaultIsNotRewardable' error", async function () {
      await expect(
        _rewardPool6022.createVault(
          "TestVault",
          lockedUntil,
          wantedAmountInTheVault,
          await _rewardPool6022.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault
        )
      ).to.revertedWithCustomError(
        _rewardPool6022,
        "LifeTimeVaultIsNotRewardable"
      );
    });
  });

  describe("Given caller didn't approve the token to be spend", async function () {
    beforeEach(async function () {
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
      await _rewardPool6022.depositToLifetimeVault();
    });

    it("Should revert with 'ERC20InsufficientAllowance' error", async function () {
      await expect(
        _rewardPool6022.createVault(
          "TestVault",
          lockedUntil,
          wantedAmountInTheVault,
          await _rewardPool6022.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault
        )
      ).to.be.revertedWithCustomError(_token6022, "ERC20InsufficientAllowance");
    });
  });

  describe("Given a too short locked until", async function () {
    beforeEach(async function () {
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
      await _rewardPool6022.depositToLifetimeVault();

      await _token6022.approve(
        await _rewardPool6022.getAddress(),
        wantedAmountInTheVault
      );
    });

    it("Should revert with a 'LockedUntilTooShort' error", async function () {
      const lockedUntil = Math.floor(Date.now() / 1000);

      await expect(
        _rewardPool6022.createVault(
          "TestVault",
          lockedUntil,
          wantedAmountInTheVault,
          await _rewardPool6022.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault
        )
      ).to.be.revertedWithCustomError(_rewardPool6022, "LockedUntilTooShort()");
    });
  });

  describe("Given caller is owner, approve the token to be spend and lifetime vault is rewardable", async function () {
    beforeEach(async function () {
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
      await _rewardPool6022.depositToLifetimeVault();

      await _token6022.approve(
        await _rewardPool6022.getAddress(),
        wantedAmountInTheVault
      );
    });

    it("Should emit 'VaultCreated' event", async function () {
      await expect(
        _rewardPool6022.createVault(
          "TestVault",
          lockedUntil,
          wantedAmountInTheVault,
          await _rewardPool6022.protocolToken(),
          BigInt(0),
          wantedAmountInTheVault
        )
      ).to.emit(_rewardPool6022, "VaultCreated");
    });

    it("Should increase reward weight", async function () {
      await _rewardPool6022.createVault(
        "TestVault",
        lockedUntil,
        wantedAmountInTheVault,
        await _rewardPool6022.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault
      );

      const vaultAddress = await _rewardPool6022.allVaults(1);

      expect(
        await _rewardPool6022.vaultsRewardWeight(vaultAddress)
      ).to.be.greaterThan(0);
    });

    it("Should pay fees to the pool", async function () {
      const callerBalanceOfBefore = await _token6022.balanceOf(_owner.address);
      const rewardPoolBalanceOfBefore = await _token6022.balanceOf(
        await _rewardPool6022.getAddress()
      );

      await _rewardPool6022.createVault(
        "TestVault",
        lockedUntil,
        wantedAmountInTheVault,
        await _rewardPool6022.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault
      );

      const callerBalanceOfAfter = await _token6022.balanceOf(_owner.address);
      const rewardPoolBalanceOfAfter = await _token6022.balanceOf(
        await _rewardPool6022.getAddress()
      );

      const expectedFees = computeFees(wantedAmountInTheVault);

      expect(callerBalanceOfAfter).to.be.equal(
        callerBalanceOfBefore - expectedFees
      );
      expect(rewardPoolBalanceOfAfter).to.be.equal(
        rewardPoolBalanceOfBefore + expectedFees
      );
    });

    it("Should send the keys of the vault to the caller (owner)", async function () {
      const tx = await _rewardPool6022.createVault(
        "TestVault",
        lockedUntil,
        wantedAmountInTheVault,
        await _rewardPool6022.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault
      );
      const txReceipt = await tx.wait();

      const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await vault.balanceOf(_owner.address)).to.be.equal(3);
    });

    it("Should create the vault as non rewardable", async function () {
      const tx = await _rewardPool6022.createVault(
        "TestVault",
        lockedUntil,
        wantedAmountInTheVault,
        await _rewardPool6022.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault
      );
      const txReceipt = await tx.wait();

      const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await vault.isRewardable()).to.be.false;
    });

    it("Should mark the vault as non deposited", async function () {
      const tx = await _rewardPool6022.createVault(
        "TestVault",
        lockedUntil,
        wantedAmountInTheVault,
        await _rewardPool6022.protocolToken(),
        BigInt(0),
        wantedAmountInTheVault
      );
      const txReceipt = await tx.wait();

      const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await vault.isDeposited()).to.be.false;
    });

    describe("And wanted token is not protocol token", async function () {
      it("Should pay fees according to backed value to the pool", async function () {
        const backedValueProtocolToken = BigInt(10);

        const callerBalanceOfBefore = await _token6022.balanceOf(
          _owner.address
        );
        const rewardPoolBalanceOfBefore = await _token6022.balanceOf(
          await _rewardPool6022.getAddress()
        );

        await _rewardPool6022.createVault(
          "TestVault",
          lockedUntil,
          wantedAmountInTheVault,
          ethers.ZeroAddress, // Put any address you want, just must not be the _token6022 address
          BigInt(0),
          backedValueProtocolToken
        );

        const callerBalanceOfAfter = await _token6022.balanceOf(_owner.address);
        const rewardPoolBalanceOfAfter = await _token6022.balanceOf(
          await _rewardPool6022.getAddress()
        );

        const expectedFees = computeFees(backedValueProtocolToken);

        expect(callerBalanceOfAfter).to.be.equal(
          callerBalanceOfBefore - expectedFees
        );
        expect(rewardPoolBalanceOfAfter).to.be.equal(
          rewardPoolBalanceOfBefore + expectedFees
        );
      });
    });

    describe("And wanted token is protocol token", async function () {
      describe("But caller put a different amount between backed value and wanted token", async function () {
        it("Should pay fees according to wanted amount to the pool", async function () {
          const callerBalanceOfBefore = await _token6022.balanceOf(
            _owner.address
          );
          const rewardPoolBalanceOfBefore = await _token6022.balanceOf(
            await _rewardPool6022.getAddress()
          );

          await _rewardPool6022.createVault(
            "TestVault",
            lockedUntil,
            wantedAmountInTheVault,
            await _rewardPool6022.protocolToken(),
            BigInt(0),
            BigInt(0) // Here we put another value than "wantedAmountInTheVault"
          );

          const callerBalanceOfAfter = await _token6022.balanceOf(
            _owner.address
          );
          const rewardPoolBalanceOfAfter = await _token6022.balanceOf(
            await _rewardPool6022.getAddress()
          );

          const expectedFees = computeFees(wantedAmountInTheVault);

          expect(callerBalanceOfAfter).to.be.equal(
            callerBalanceOfBefore - expectedFees
          );
          expect(rewardPoolBalanceOfAfter).to.be.equal(
            rewardPoolBalanceOfBefore + expectedFees
          );
        });
      });

      describe("But caller put same amount between backed value and wanted token", async function () {
        it("Should pay fees according to backed value to the pool", async function () {
          const callerBalanceOfBefore = await _token6022.balanceOf(
            _owner.address
          );
          const rewardPoolBalanceOfBefore = await _token6022.balanceOf(
            await _rewardPool6022.getAddress()
          );

          await _rewardPool6022.createVault(
            "TestVault",
            lockedUntil,
            wantedAmountInTheVault,
            await _rewardPool6022.protocolToken(),
            BigInt(0),
            wantedAmountInTheVault // Here we put the same value as wanted token
          );

          const callerBalanceOfAfter = await _token6022.balanceOf(
            _owner.address
          );
          const rewardPoolBalanceOfAfter = await _token6022.balanceOf(
            await _rewardPool6022.getAddress()
          );

          const expectedFees = computeFees(wantedAmountInTheVault);

          expect(callerBalanceOfAfter).to.be.equal(
            callerBalanceOfBefore - expectedFees
          );
          expect(rewardPoolBalanceOfAfter).to.be.equal(
            rewardPoolBalanceOfBefore + expectedFees
          );
        });
      });
    });
  });
});
