import { ethers } from "hardhat";
import {
  RewardPool6022,
  RewardPoolLifetimeVault6022,
  Token6022,
} from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  loadFixture,
  reset,
  time,
} from "@nomicfoundation/hardhat-network-helpers";
import { expect } from "chai";
import {
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
  parseVaultFromVaultCreatedLogs,
} from "../utils";

describe("When closing and collecting lifetime vault", async function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  const lifetimeVaultAmount = ethers.parseEther("1");

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
        _rewardPool6022.connect(_otherAccount).closeAndCollectLifetimeVault()
      ).to.be.revertedWithCustomError(
        _rewardPool6022,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Given lifetime vault is not initialized", async function () {
    it("Should revert with 'LifeTimeVaultDoesNotExist' error", async function () {
      await expect(
        _rewardPool6022.closeAndCollectLifetimeVault()
      ).to.be.revertedWithCustomError(
        _rewardPool6022,
        "LifeTimeVaultDoesNotExist"
      );
    });
  });

  describe("Given lifetime vault is not rewardable", async function () {
    beforeEach(async function () {
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);

      // closeAndCollectLifetimeVault will withdraw the lifetime vault
      // The lifetime vault will be not rewardable
      await _rewardPool6022.closeAndCollectLifetimeVault();
    });

    it("Should revert with 'LifeTimeVaultIsNotRewardable' error", async function () {
      await expect(
        _rewardPool6022.closeAndCollectLifetimeVault()
      ).to.be.revertedWithCustomError(
        _rewardPool6022,
        "LifeTimeVaultIsNotRewardable"
      );
    });
  });

  describe("Given still rewardable vaults in the pool", async function () {
    const wantedAmountInTheVault = ethers.parseEther("1");

    beforeEach(async function () {
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);

      // Just approve a lot of tokens to pay vault creation fees
      await _token6022.approve(
        await _rewardPool6022.getAddress(),
        ethers.parseEther("100")
      );

      const tx = await _rewardPool6022.createVault(
        "TestVault",
        lockedUntil,
        wantedAmountInTheVault,
        await _token6022.getAddress(),
        BigInt(0),
        wantedAmountInTheVault
      );
      const txReceipt = await tx.wait();

      const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);
      await _token6022.approve(
        await vault.getAddress(),
        await vault.wantedAmount()
      );
      await vault.deposit();
    });

    it("Should revert with 'RemainingRewardableVaults' error", async function () {
      await expect(
        _rewardPool6022.closeAndCollectLifetimeVault()
      ).to.be.revertedWithCustomError(
        _rewardPool6022,
        "RemainingRewardableVaults"
      );
    });
  });

  describe("Given lifetime vault can be withdrawn", async function () {
    let _lifetimeVault: RewardPoolLifetimeVault6022;

    beforeEach(async function () {
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      const tx = await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
      const txReceipt = await tx.wait();

      _lifetimeVault = await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(
        txReceipt!.logs
      );

      // Just approve a lot of tokens to pay vault creation fees
      await _token6022.approve(
        await _rewardPool6022.getAddress(),
        ethers.parseEther("100")
      );
    });

    describe("And there was vaults in the pool", async function () {
      const wantedAmountInTheVault = ethers.parseEther("1");

      beforeEach(async function () {
        let vaults = [];
        const vaultsCount = Math.floor(Math.random() * 4) + 2;

        for (let i = 0; i < vaultsCount; i++) {
          const tx = await _rewardPool6022.createVault(
            "TestVault",
            lockedUntil,
            wantedAmountInTheVault,
            await _token6022.getAddress(),
            BigInt(0),
            wantedAmountInTheVault
          );
          const txReceipt = await tx.wait();

          const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);
          await _token6022.approve(
            await vault.getAddress(),
            await vault.wantedAmount()
          );

          await vault.deposit();

          vaults.push(vault);
        }

        await time.increase(lockedDuring + 1);

        for (let i = 0; i < vaults.length; i++) {
          await vaults[i].withdraw();
        }
      });

      it("Should emit 'RewardPoolClosed' event", async function () {
        await expect(_rewardPool6022.closeAndCollectLifetimeVault()).to.emit(
          _rewardPool6022,
          "RewardPoolClosed"
        );
      });

      it("Should transfer collateral of lifetime vault and remaining funds of the reward pool to the owner", async function () {
        const ownerBalanceOfBefore = await _token6022.balanceOf(_owner.address);
        const lifetimeVaultBalanceOfBefore = await _token6022.balanceOf(
          await _lifetimeVault.getAddress()
        );
        const remainingFunds = await _token6022.balanceOf(
          await _rewardPool6022.getAddress()
        );
        await _rewardPool6022.closeAndCollectLifetimeVault();

        const ownerBalanceOfAfter = await _token6022.balanceOf(_owner.address);

        // Greater because their is also the fees that the lifetime vault collected with other vault creation
        expect(ownerBalanceOfAfter).to.be.equal(
          ownerBalanceOfBefore + lifetimeVaultBalanceOfBefore + remainingFunds
        );
      });

      it("Should be no more protocol token into the lifetime vault", async function () {
        await _rewardPool6022.closeAndCollectLifetimeVault();

        expect(
          await _token6022.balanceOf(await _lifetimeVault.getAddress())
        ).to.be.equal(0);
      });

      it("Should be no more protocol token funds in the reward pool", async function () {
        await _rewardPool6022.closeAndCollectLifetimeVault();

        expect(
          await _token6022.balanceOf(await _rewardPool6022.getAddress())
        ).to.be.equal(0);
      });

      it("Should not be able to create a vault after", async function () {
        await _rewardPool6022.closeAndCollectLifetimeVault();

        await expect(
          _rewardPool6022.createVault(
            "TestVault",
            lockedUntil,
            lifetimeVaultAmount,
            await _token6022.getAddress(),
            BigInt(0),
            lifetimeVaultAmount
          )
        ).to.be.revertedWithCustomError(
          _rewardPool6022,
          "LifeTimeVaultIsNotRewardable"
        );
      });
    });

    describe("And there was no vaults in the pool", async function () {
      it("Should emit 'RewardPoolClosed' event", async function () {
        await expect(_rewardPool6022.closeAndCollectLifetimeVault()).to.emit(
          _rewardPool6022,
          "RewardPoolClosed"
        );
      });

      it("Should transfer collateral of lifetime vault and remaining funds of the reward pool to the owner", async function () {
        const ownerBalanceOfBefore = await _token6022.balanceOf(_owner.address);
        const lifetimeVaultBalanceOfBefore = await _token6022.balanceOf(
          await _lifetimeVault.getAddress()
        );
        const remainingFunds = await _token6022.balanceOf(
          await _rewardPool6022.getAddress()
        );
        await _rewardPool6022.closeAndCollectLifetimeVault();

        const ownerBalanceOfAfter = await _token6022.balanceOf(_owner.address);

        // Greater because their is also the fees that the lifetime vault collected with other vault creation
        expect(ownerBalanceOfAfter).to.be.equal(
          ownerBalanceOfBefore + lifetimeVaultBalanceOfBefore + remainingFunds
        );
      });

      it("Should be no more protocol token into the lifetime vault", async function () {
        await _rewardPool6022.closeAndCollectLifetimeVault();

        expect(
          await _token6022.balanceOf(await _lifetimeVault.getAddress())
        ).to.be.equal(0);
      });

      it("Should be no more protocol token funds in the reward pool", async function () {
        await _rewardPool6022.closeAndCollectLifetimeVault();

        expect(
          await _token6022.balanceOf(await _rewardPool6022.getAddress())
        ).to.be.equal(0);
      });

      it("Should not be able to create a vault after", async function () {
        await _rewardPool6022.closeAndCollectLifetimeVault();

        await expect(
          _rewardPool6022.createVault(
            "TestVault",
            lockedUntil,
            lifetimeVaultAmount,
            await _token6022.getAddress(),
            BigInt(0),
            lifetimeVaultAmount
          )
        ).to.be.revertedWithCustomError(
          _rewardPool6022,
          "LifeTimeVaultIsNotRewardable"
        );
      });
    });
  });
});
