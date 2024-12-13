import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  createDepositedVault,
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
} from "../utils";
import {
  Token6022,
  RewardPool6022,
  RewardPoolLifetimeVault6022,
} from "../../typechain-types";

describe("When withdrawing collateral from reward pool lifetime vault", async function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  const lifetimeVaultAmount = ethers.parseEther("1");

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  let _token6022: Token6022;
  let _rewardPool6022: RewardPool6022;
  let _rewardPoolLifetimeVault: RewardPoolLifetimeVault6022;

  async function deployRewardPoolLifetimeVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    // Didn't deploy the RewardPoolFactory6022
    // In order to test the deposit (RewardPoolFactory6022 directly calls the deposit method)
    const RewardPool6022 = await ethers.getContractFactory("RewardPool6022");
    const rewardPool6022 = await RewardPool6022.deploy(
      await owner.getAddress(),
      await controller6022.getAddress(),
      await token6022.getAddress()
    );

    await controller6022.addFactory(await owner.getAddress());
    await controller6022.pushRewardPool(await rewardPool6022.getAddress());
    await controller6022.removeFactory(await owner.getAddress());

    // Create the lifetime vault using the RewardPool6022
    await token6022.transfer(
      await rewardPool6022.getAddress(),
      lifetimeVaultAmount
    );

    const tx = await rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
    const txReceipt = await tx.wait();
    // But don't use the depositToLifetimeVault method yet (to test not deposited case)

    const rewardPoolLifetimeVault =
      await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      owner,
      token6022,
      otherAccount,
      rewardPool6022,
      rewardPoolLifetimeVault,
    };
  }

  beforeEach(async function () {
    const {
      owner,
      token6022,
      otherAccount,
      rewardPool6022,
      rewardPoolLifetimeVault,
    } = await loadFixture(deployRewardPoolLifetimeVault);

    _owner = owner;
    _token6022 = token6022;
    _otherAccount = otherAccount;
    _rewardPool6022 = rewardPool6022;
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
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );

      await _rewardPool6022.depositToLifetimeVault();
    });

    describe("But collateral is already withdrawn", async function () {
      beforeEach(async function () {
        _rewardPoolLifetimeVault.withdraw();
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
          _token6022,
          _rewardPool6022,
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

        await _token6022.approve(
          await _rewardPool6022.getAddress(),
          ethers.parseEther("100")
        );

        // Just create some withdrawn vaults
        for (let index = 0; index < wantedVaults; index++) {
          const vault = await createDepositedVault(
            _token6022,
            _rewardPool6022,
            lockedUntil,
            ethers.parseEther("1")
          );

          vault.withdraw();
        }
      });

      it("Should emit 'Withdrawn' event", async function () {
        expect(await _rewardPoolLifetimeVault.withdraw()).to.emit(
          _rewardPoolLifetimeVault,
          "Withdrawn"
        );
      });

      it("Should emit 'Harvested' event", async function () {
        expect(await _rewardPoolLifetimeVault.withdraw()).to.emit(
          _rewardPool6022,
          "Harvested"
        );
      });

      it("Should send the collateral and collected rewards to the caller", async function () {
        const balanceOfVaultBefore = await _token6022.balanceOf(
          await _rewardPoolLifetimeVault.getAddress()
        );
        const rewardsOfLifetimeVaultBefore =
          await _rewardPool6022.collectedRewards(
            await _rewardPoolLifetimeVault.getAddress()
          );

        const balanceCallerBefore = await _token6022.balanceOf(_owner.address);
        await _rewardPoolLifetimeVault.withdraw();
        const balanceCallerAfter = await _token6022.balanceOf(_owner.address);

        expect(balanceCallerAfter).to.be.equal(
          balanceOfVaultBefore +
            balanceCallerBefore +
            rewardsOfLifetimeVaultBefore
        );
      });

      it("Should be no more collateral in the vault", async function () {
        await _rewardPoolLifetimeVault.withdraw();

        expect(
          await _token6022.balanceOf(
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
