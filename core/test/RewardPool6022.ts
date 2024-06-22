import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { RewardPool6022, Token6022, Vault6022 } from "../typechain-types";
import {
  time,
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("RewardPool6022", function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployRewardPool6022() {
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
    rewardPool6022: RewardPool6022,
    token6022: Token6022,
    amount: bigint = ethers.parseEther("1")
  ) {
    await token6022.approve(await rewardPool6022.getAddress(), amount);
    const tx = await rewardPool6022.createVault(
      "TestVault",
      Math.floor(lockedUntil),
      amount,
      await token6022.getAddress(),
      BigInt(0),
      amount
    );

    const txReceipt = await tx.wait();

    const events = <EventLog[]>(
      txReceipt?.logs.filter((x) => x instanceof EventLog)
    );
    const vaultCreatedEvent = events.filter(
      (x) =>
        x.fragment.name === rewardPool6022.filters["VaultCreated(address)"].name
    )[0];

    const Vault6022 = await ethers.getContractFactory("Vault6022");
    return Vault6022.attach(vaultCreatedEvent.args[0]) as Vault6022;
  }

  async function depositToVault(
    vault6022: Vault6022,
    token6022: Token6022,
    user: HardhatEthersSigner
  ) {
    await token6022
      .connect(user)
      .approve(await vault6022.getAddress(), ethers.parseEther("1"));
    await vault6022.connect(user).deposit();
  }

  describe("createVault", function () {
    it("Should fail if the caller is not the owner", async function () {
      const { rewardPool6022, otherAccount } =
        await loadFixture(deployRewardPool6022);

      await expect(
        rewardPool6022
          .connect(otherAccount)
          .createVault(
            "TestVault",
            lockedUntil,
            ethers.parseEther("1"),
            await rewardPool6022.protocolToken(),
            BigInt(0),
            ethers.parseEther("1")
          )
      ).to.revertedWithCustomError(
        rewardPool6022,
        "OwnableUnauthorizedAccount"
      );
    });

    it("Should fail if there is rewardable vault without approving 6022 token usage", async function () {
      const { rewardPool6022, token6022 } =
        await loadFixture(deployRewardPool6022);

      const lockedUntil = Date.now() + 1000 * 60 * 60;

      // This one should work because the first time the reward pool didn't take fees
      await rewardPool6022.createVault(
        "TestVault",
        lockedUntil,
        ethers.parseEther("1"),
        await rewardPool6022.protocolToken(),
        BigInt(0),
        ethers.parseEther("1")
      );

      // Make deposit in the first vault to set it to "rewardable"
      const firstVaultAddress = await rewardPool6022.allVaults(0);
      const firstVault = await ethers.getContractAt(
        "Vault6022",
        firstVaultAddress
      );

      await token6022.approve(firstVaultAddress, ethers.parseEther("1"));
      await firstVault.deposit();

      await expect(
        rewardPool6022.createVault(
          "TestVault",
          lockedUntil,
          ethers.parseEther("1"),
          await rewardPool6022.protocolToken(),
          BigInt(0),
          ethers.parseEther("1")
        )
      ).to.be.revertedWithCustomError(token6022, "ERC20InsufficientAllowance");
    });

    it("Should work the first time without approve 6022 token usage", async function () {
      const { rewardPool6022 } = await loadFixture(deployRewardPool6022);

      const lockedUntil = Date.now() + 1000 * 60 * 60;

      await expect(
        rewardPool6022.createVault(
          "TestVault",
          lockedUntil,
          ethers.parseEther("1"),
          await rewardPool6022.protocolToken(),
          BigInt(0),
          ethers.parseEther("1")
        )
      ).to.emit(rewardPool6022, "VaultCreated");

      const vaultAddress = await rewardPool6022.allVaults(0);

      expect(
        await rewardPool6022.collectedFees(vaultAddress)
      ).to.be.greaterThan(0);
    });

    it("Should work if there is rewardable vault with approve 6022 token usage", async function () {
      const { rewardPool6022, token6022 } =
        await loadFixture(deployRewardPool6022);

      const lockedUntil = Date.now() + 1000 * 60 * 60;

      await rewardPool6022.createVault(
        "TestVault",
        lockedUntil,
        ethers.parseEther("1"),
        await rewardPool6022.protocolToken(),
        BigInt(0),
        ethers.parseEther("1")
      );

      // Make deposit in the first vault to set it to "rewardable"
      const firstVaultAddress = await rewardPool6022.allVaults(0);
      const firstVault = await ethers.getContractAt(
        "Vault6022",
        firstVaultAddress
      );

      await token6022.approve(firstVaultAddress, ethers.parseEther("1"));
      await firstVault.deposit();

      await token6022.approve(
        await rewardPool6022.getAddress(),
        ethers.parseEther("100000")
      );

      await expect(
        rewardPool6022.createVault(
          "TestVault",
          Math.floor(lockedUntil),
          ethers.parseEther("1"),
          await rewardPool6022.protocolToken(),
          BigInt(0),
          ethers.parseEther("1")
        )
      ).to.emit(rewardPool6022, "VaultCreated");

      const vaultAddress = await rewardPool6022.allVaults(1);

      expect(
        await rewardPool6022.collectedFees(vaultAddress)
      ).to.be.greaterThan(0);
    });
  });

  describe("harvestRewards", function () {
    it("Should fail if the caller is not register as a vault", async function () {
      const { rewardPool6022, owner } = await loadFixture(deployRewardPool6022);

      await expect(
        rewardPool6022.harvestRewards(await owner.getAddress())
      ).to.revertedWithCustomError(rewardPool6022, "CallerNotVault");
    });

    it("Should work if the caller is register as a vault", async function () {
      const { rewardPool6022, token6022, owner, otherAccount } =
        await loadFixture(deployRewardPool6022);

      const vault = await deployVaultWithRewardPool6022(
        rewardPool6022,
        token6022
      );

      const otherAccountAddress = await otherAccount.getAddress();

      await token6022.transfer(otherAccountAddress, ethers.parseEther("1"));
      await vault.transferFrom(
        await owner.getAddress(),
        otherAccountAddress,
        1
      );

      await depositToVault(vault, token6022, otherAccount);

      for (let i = 0; i < 2; i++) {
        // Create new vaults to generate rewards
        await deployVaultWithRewardPool6022(rewardPool6022, token6022);
      }

      await time.increase(lockedDuring);

      const balanceOfBeforeWithdraw =
        await token6022.balanceOf(otherAccountAddress);

      // "withdraw" will call "harvestRewards" function in the reward pool
      await expect(vault.connect(otherAccount).withdraw()).to.emit(
        rewardPool6022,
        "Harvested"
      );

      expect(await token6022.balanceOf(otherAccountAddress)).to.be.gt(
        balanceOfBeforeWithdraw
      );
    });
  });

  describe("reinvestRewards", function () {
    it("Should fail if the caller is not register as a vault", async function () {
      const { rewardPool6022 } = await loadFixture(deployRewardPool6022);

      await expect(rewardPool6022.reinvestRewards()).to.revertedWithCustomError(
        rewardPool6022,
        "CallerNotVault"
      );
    });

    it("Should work if the caller is register as a vault", async function () {
      const { rewardPool6022, token6022, owner, otherAccount } =
        await loadFixture(deployRewardPool6022);

      const vault = await deployVaultWithRewardPool6022(
        rewardPool6022,
        token6022,
        ethers.parseEther("1")
      );

      const otherAccountAddress = await otherAccount.getAddress();

      await token6022.transfer(otherAccountAddress, ethers.parseEther("1"));
      await vault.transferFrom(
        await owner.getAddress(),
        otherAccountAddress,
        1
      );

      await depositToVault(vault, token6022, otherAccount);

      const createdVaults = [];

      for (let i = 0; i < 2; i++) {
        // Create new vaults to generate rewards
        let createdVault = await deployVaultWithRewardPool6022(
          rewardPool6022,
          token6022,
          ethers.parseEther("1")
        );
        createdVaults.push(createdVault);

        await depositToVault(createdVault, token6022, owner);
      }

      let totalRewardsBefore = BigInt(0);

      const rewardFirstPoolBefore = await rewardPool6022.collectedRewards(
        await vault.getAddress()
      );
      totalRewardsBefore += rewardFirstPoolBefore;
      expect(rewardFirstPoolBefore).to.be.equal(ethers.parseEther("0.03"));

      const rewardSecondPoolBefore = await rewardPool6022.collectedRewards(
        await createdVaults[0].getAddress()
      );
      totalRewardsBefore += rewardSecondPoolBefore;
      expect(rewardSecondPoolBefore).to.be.equal(ethers.parseEther("0.01"));

      const rewardThirdPoolBefore = await rewardPool6022.collectedRewards(
        await createdVaults[1].getAddress()
      );
      totalRewardsBefore += rewardThirdPoolBefore;
      expect(rewardThirdPoolBefore).to.be.equal(0);

      expect(totalRewardsBefore).to.be.equal(ethers.parseEther("0.04"));

      // "withdraw" will call "reinvestRewards" function in the reward pool
      await expect(vault.withdraw()).to.emit(rewardPool6022, "Reinvested");

      let totalRewardsAfter = BigInt(0);

      const rewardFirstPoolAfter = await rewardPool6022.collectedRewards(
        await vault.getAddress()
      );
      totalRewardsAfter += rewardFirstPoolAfter;
      expect(rewardFirstPoolAfter).to.be.equal(0);

      const rewardSecondPoolAfter = await rewardPool6022.collectedRewards(
        await createdVaults[0].getAddress()
      );
      totalRewardsAfter += rewardSecondPoolAfter;
      expect(rewardSecondPoolAfter).to.be.equal(ethers.parseEther("0.025"));

      const rewardThirdPoolAfter = await rewardPool6022.collectedRewards(
        await createdVaults[1].getAddress()
      );
      totalRewardsAfter += rewardThirdPoolAfter;
      expect(rewardThirdPoolAfter).to.be.equal(ethers.parseEther("0.015"));

      expect(totalRewardsBefore).to.be.equal(totalRewardsAfter);

      expect(
        await token6022.balanceOf(await rewardPool6022.getAddress())
      ).to.be.equal(totalRewardsAfter);
    });
  });
});
