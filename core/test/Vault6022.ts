import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { Vault6022 } from "../typechain-types";
import {
  time,
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Vault6022", function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployEmptyVaultFixture() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(ethers.parseEther("100000"));

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const RewardPool6022 = await ethers.getContractFactory("RewardPool6022");
    const rewardPool6022 = await RewardPool6022.deploy(
      await controller6022.getAddress(),
      await token6022.getAddress()
    );

    await controller6022.addFactory(await owner.getAddress());
    await controller6022.pushRewardPool(await rewardPool6022.getAddress());

    await token6022.approve(
      await rewardPool6022.getAddress(),
      ethers.parseEther("100000")
    );

    const tx = await rewardPool6022.createVault(
      "Vault6022",
      lockUntil,
      ethers.parseEther("10"),
      await token6022.getAddress(),
      ethers.parseEther("10")
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
    const vault6022 = Vault6022.attach(vaultCreatedEvent.args[0]) as Vault6022;

    await token6022.transfer(
      await otherAccount.getAddress(),
      ethers.parseEther("1000")
    );

    return {
      owner,
      vault6022,
      token6022,
      otherAccount,
      rewardPool6022,
    };
  }

  async function deployDepositedVaultFixture() {
    const { owner, vault6022, token6022, otherAccount, rewardPool6022 } =
      await deployEmptyVaultFixture();

    vault6022.approve(await owner.getAddress(), 1);
    vault6022.transferFrom(
      await owner.getAddress(),
      await otherAccount.getAddress(),
      1
    );

    await token6022
      .connect(otherAccount)
      .approve(await vault6022.getAddress(), await vault6022.wantedAmount());
    await vault6022.connect(otherAccount).deposit();

    return {
      owner,
      vault6022,
      token6022,
      otherAccount,
      rewardPool6022,
    };
  }

  describe("deposit", function () {
    it("Should fail if is already deposited", async function () {
      const { vault6022, token6022, owner, otherAccount } = await loadFixture(
        deployEmptyVaultFixture
      );

      vault6022.approve(await owner.getAddress(), 1);
      vault6022.transferFrom(
        await owner.getAddress(),
        await otherAccount.getAddress(),
        1
      );

      const vault6022Runner = vault6022.connect(otherAccount);

      await token6022
        .connect(otherAccount)
        .approve(await vault6022.getAddress(), await vault6022.wantedAmount());
      await vault6022Runner.deposit();

      await expect(vault6022Runner.deposit()).to.be.revertedWithCustomError(
        vault6022,
        "ContractAlreadyDeposited"
      );
    });

    it("Should fail if caller don't have NFT to deposit", async function () {
      const { vault6022, otherAccount } = await loadFixture(
        deployEmptyVaultFixture
      );

      await expect(
        vault6022.connect(otherAccount).deposit()
      ).to.be.revertedWithCustomError(vault6022, "NotEnoughtNFTToDeposit");
    });

    it("Should fail if lockedUntil is reached", async function () {
      const { vault6022, owner, otherAccount } = await loadFixture(
        deployEmptyVaultFixture
      );

      vault6022.approve(await owner.getAddress(), 1);
      vault6022.transferFrom(
        await owner.getAddress(),
        await otherAccount.getAddress(),
        1
      );

      await time.increase(lockIn);

      await expect(
        vault6022.connect(otherAccount).deposit()
      ).to.be.revertedWithCustomError(vault6022, "TooLateToDeposit");
    });

    it("Should work", async function () {
      const { vault6022, token6022, owner, otherAccount } = await loadFixture(
        deployEmptyVaultFixture
      );

      vault6022.approve(await owner.getAddress(), 1);
      vault6022.transferFrom(
        await owner.getAddress(),
        await otherAccount.getAddress(),
        1
      );

      await token6022
        .connect(otherAccount)
        .approve(await vault6022.getAddress(), await vault6022.wantedAmount());

      await expect(vault6022.connect(otherAccount).deposit()).to.emit(
        vault6022,
        "Deposited"
      );
    });
  });

  describe("withdraw", function () {
    it("Should fail if no deposit", async function () {
      const { vault6022, otherAccount } = await loadFixture(
        deployEmptyVaultFixture
      );

      await expect(
        vault6022.connect(otherAccount).withdraw()
      ).to.be.revertedWithCustomError(vault6022, "ContractNotDeposited");
    });

    it("Should fail if not enough NFT to withdraw", async function () {
      const { vault6022, otherAccount } = await loadFixture(
        deployDepositedVaultFixture
      );

      expect(await vault6022.getRequiredNftsToWithdraw()).to.be.equal(2);
      expect(
        await vault6022.balanceOf(await otherAccount.getAddress())
      ).to.be.equal(1);

      await expect(
        vault6022.connect(otherAccount).withdraw()
      ).to.be.revertedWithCustomError(vault6022, "NotEnoughtNFTToWithdraw");
    });

    it("Should work if hold 2 NFT and lockedUntil is not reached", async function () {
      const { rewardPool6022, vault6022 } = await loadFixture(
        deployDepositedVaultFixture
      );

      // Owner already own 2 NFT
      await expect(vault6022.withdraw())
        .to.emit(vault6022, "Withdrawn")
        .to.emit(rewardPool6022, "Reinvested");
    });

    it("Should work if hold 1 NFT and lockedUntil is reached", async function () {
      const { vault6022, rewardPool6022, otherAccount } = await loadFixture(
        deployDepositedVaultFixture
      );

      await time.increase(lockIn);

      await expect(vault6022.connect(otherAccount).withdraw())
        .to.emit(vault6022, "Withdrawn")
        .to.emit(rewardPool6022, "Harvested");
    });
  });
});
