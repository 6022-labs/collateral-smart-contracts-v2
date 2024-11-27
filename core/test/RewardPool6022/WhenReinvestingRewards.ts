import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { RewardPool6022, Token6022, Vault6022 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  time,
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When reinvesting reward", function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  let _token6022: Token6022;
  let _rewardPool6022: RewardPool6022;

  let _owner: HardhatEthersSigner;

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

    const RewardPoolFactory6022 = await ethers.getContractFactory(
      "RewardPoolFactory6022"
    );
    const rewardPoolFactory6022 = await RewardPoolFactory6022.deploy(
      await controller6022.getAddress(),
      await token6022.getAddress()
    );

    await controller6022.addFactory(await rewardPoolFactory6022.getAddress());

    const tx = await rewardPoolFactory6022.createRewardPool();
    const txReceipt = await tx.wait();

    const events = <EventLog[]>(
      txReceipt?.logs.filter((x) => x instanceof EventLog)
    );
    const rewardPoolCreatedEvent = events.filter(
      (x) =>
        x.fragment.name ===
        rewardPoolFactory6022.filters["RewardPoolCreated(address)"].name
    )[0];

    const RewardPool6022 = await ethers.getContractFactory("RewardPool6022");
    const rewardPool6022 = RewardPool6022.attach(
      rewardPoolCreatedEvent.args[0]
    ) as RewardPool6022;

    return { controller6022, token6022, rewardPool6022, owner, otherAccount };
  }

  async function deployVaultWithRewardPool6022(
    amount: bigint = ethers.parseEther("1")
  ) {
    await _token6022.approve(await _rewardPool6022.getAddress(), amount);
    const tx = await _rewardPool6022.createVault(
      "TestVault",
      Math.floor(lockedUntil),
      amount,
      await _token6022.getAddress(),
      BigInt(0),
      amount
    );

    const txReceipt = await tx.wait();

    const events = <EventLog[]>(
      txReceipt?.logs.filter((x) => x instanceof EventLog)
    );
    const vaultCreatedEvent = events.filter(
      (x) =>
        x.fragment.name ===
        _rewardPool6022.filters["VaultCreated(address)"].name
    )[0];

    const Vault6022 = await ethers.getContractFactory("Vault6022");
    return Vault6022.attach(vaultCreatedEvent.args[0]) as Vault6022;
  }

  async function getRewardableVaults() {
    let rewardableVaults = [];
    let index = 0;

    let currentVault: string;

    const Vault6022 = await ethers.getContractFactory("Vault6022");

    try {
      while ((currentVault = await _rewardPool6022.allVaults(index))) {
        let vault = Vault6022.attach(currentVault) as Vault6022;

        if (await vault.isRewardable()) {
          rewardableVaults.push(currentVault);
        }
        index++;
      }
    } catch (e) {
      // Do nothing
    }

    return rewardableVaults;
  }

  beforeEach(async function () {
    const { token6022, rewardPool6022, owner } =
      await loadFixture(deployRewardPool);

    _owner = owner;
    _token6022 = token6022;
    _rewardPool6022 = rewardPool6022;
  });

  describe("Given the caller is not register as a vault", function () {
    it("Should revert with 'CallerNotVault' error", async function () {
      await expect(
        _rewardPool6022.reinvestRewards()
      ).to.revertedWithCustomError(_rewardPool6022, "CallerNotVault");
    });
  });

  describe("Given the caller is register as a vault", function () {
    let _vault: Vault6022;

    beforeEach(async function () {
      _vault = await deployVaultWithRewardPool6022();
      await _token6022.approve(
        await _vault.getAddress(),
        ethers.parseEther("1")
      );
      await _vault.deposit();
    });

    describe("And there is no rewards to reinvest", function () {
      it("Should emit 'Reinvested' event", async function () {
        await expect(_vault.withdraw())
          .to.emit(_rewardPool6022, "Reinvested")
          .withArgs(await _vault.getAddress(), 0);
      });
    });

    describe("And there is rewards to reinvest", function () {
      beforeEach(async function () {
        // Create new vaults to generate rewards
        for (let i = 0; i < 2; i++) {
          let wantedAmount = ethers.parseEther((Math.random() * 10).toString());
          let newVault = await deployVaultWithRewardPool6022(wantedAmount);
          await _token6022.approve(await newVault.getAddress(), wantedAmount);
          await newVault.deposit();
        }
      });

      it("Should emit 'Reinvested' event", async function () {
        const collectedRewards = await _rewardPool6022.collectedRewards(
          await _vault.getAddress()
        );

        await expect(_vault.withdraw())
          .to.emit(_rewardPool6022, "Reinvested")
          .withArgs(await _vault.getAddress(), collectedRewards);
      });

      it("Should increase collected rewards of rewardable pools", async function () {
        const collectedRewardsThatWillBeReinvested =
          await _rewardPool6022.collectedRewards(await _vault.getAddress());

        const rewardableVaults = await getRewardableVaults();

        let currentVaultAddress = await _vault.getAddress();
        const rewardableVaultsWithoutCurrentVault = rewardableVaults.filter(
          (x) => x != currentVaultAddress
        );

        let collectedRewardsBefore = {} as Record<string, bigint>;
        let collectedFees = {} as Record<string, bigint>;
        let totalCollectedFees = BigInt(0);

        for (let element of rewardableVaultsWithoutCurrentVault) {
          collectedRewardsBefore[element] =
            await _rewardPool6022.collectedRewards(element);

          const collectedFee = await _rewardPool6022.collectedFees(element);
          collectedFees[element] = collectedFee;
          totalCollectedFees += collectedFee;
        }

        await _vault.withdraw();

        for (let element of rewardableVaultsWithoutCurrentVault) {
          let collectedRewardsAfter =
            await _rewardPool6022.collectedRewards(element);

          let expectedCollectedRewards =
            collectedRewardsBefore[element] +
            (collectedRewardsThatWillBeReinvested * collectedFees[element]) /
              totalCollectedFees;

          expect(collectedRewardsAfter).to.be.equal(expectedCollectedRewards);
        }
      });
    });
  });
});
