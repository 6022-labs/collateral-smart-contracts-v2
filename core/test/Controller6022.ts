import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { Vault6022, Controller6022, RewardPool6022 } from "../typechain-types";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("Controller6022", function () {
  // We define a fixture to reuse the same setup in every test.
  // We use loadFixture to run this setup once, snapshot that state,
  // and reset Hardhat Network to that snapshot in every test.
  async function deployController() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    return {
      controller6022,
      owner,
      otherAccount,
    };
  }

  async function deployRewardPool(
    ownerAddress: string,
    controller: Controller6022
  ) {
    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(
      ownerAddress,
      ethers.parseEther("100000")
    );

    const RewardPoolFactory6022 = await ethers.getContractFactory(
      "RewardPoolFactory6022"
    );
    const rewardPoolFactory6022 = await RewardPoolFactory6022.deploy(
      await controller.getAddress(),
      await token6022.getAddress()
    );

    await controller.addFactory(await rewardPoolFactory6022.getAddress());

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

    await token6022.approve(
      await rewardPool6022.getAddress(),
      ethers.parseEther("100000")
    );

    return rewardPool6022;
  }

  async function deployVault(rewardPool: RewardPool6022) {
    const lockedUntil = Date.now() + 1000 * 60 * 60;

    const tx = await rewardPool.createVault(
      "TestVault",
      Math.floor(lockedUntil),
      ethers.parseEther("1"),
      await rewardPool.protocolToken(),
      BigInt(0),
      ethers.parseEther("1")
    );

    const txReceipt = await tx.wait();

    const events = <EventLog[]>(
      txReceipt?.logs.filter((x) => x instanceof EventLog)
    );
    const vaultCreatedEvent = events.filter(
      (x) =>
        x.fragment.name === rewardPool.filters["VaultCreated(address)"].name
    )[0];

    const Vault6022 = await ethers.getContractFactory("Vault6022");
    return Vault6022.attach(vaultCreatedEvent.args[0]) as Vault6022;
  }

  describe("Deployement", function () {
    it("Should work", async function () {
      const { controller6022 } = await loadFixture(deployController);
      expect(await controller6022.getAddress()).not.be.undefined;
    });
  });

  describe("addAdmin", function () {
    it("Should fail if not called by admin", async function () {
      const { controller6022, otherAccount } =
        await loadFixture(deployController);

      await expect(
        controller6022
          .connect(otherAccount)
          .addAdmin(await otherAccount.getAddress())
      ).to.be.revertedWithCustomError(
        controller6022,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should work if called by admin", async function () {
      const { controller6022, otherAccount } =
        await loadFixture(deployController);

      await expect(
        controller6022.addAdmin(await otherAccount.getAddress())
      ).to.emit(controller6022, "AdminAdded");
    });
  });

  describe("removeAdmin", function () {
    it("Should fail if not called by admin", async function () {
      const { controller6022, otherAccount } =
        await loadFixture(deployController);

      await expect(
        controller6022
          .connect(otherAccount)
          .removeAdmin(await otherAccount.getAddress())
      ).to.be.revertedWithCustomError(
        controller6022,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should work if called by admin", async function () {
      const { controller6022, otherAccount } =
        await loadFixture(deployController);

      await controller6022.addAdmin(await otherAccount.getAddress());

      await expect(
        controller6022.removeAdmin(await otherAccount.getAddress())
      ).to.emit(controller6022, "AdminRemoved");
    });
  });

  describe("addFactory", function () {
    it("Should fail if not called by admin", async function () {
      const { controller6022, otherAccount } =
        await loadFixture(deployController);

      await expect(
        controller6022
          .connect(otherAccount)
          .addFactory(await otherAccount.getAddress())
      ).to.be.revertedWithCustomError(
        controller6022,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should work if called by admin", async function () {
      const { controller6022, otherAccount } =
        await loadFixture(deployController);

      await expect(
        controller6022.addFactory(await otherAccount.getAddress())
      ).to.emit(controller6022, "FactoryAdded");
    });
  });

  describe("removeFactory", function () {
    it("Should fail if not called by admin", async function () {
      const { controller6022, otherAccount } =
        await loadFixture(deployController);

      await expect(
        controller6022
          .connect(otherAccount)
          .removeFactory(await otherAccount.getAddress())
      ).to.be.revertedWithCustomError(
        controller6022,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should work if called by admin", async function () {
      const { controller6022, otherAccount } =
        await loadFixture(deployController);

      await controller6022.addFactory(await otherAccount.getAddress());

      await expect(
        controller6022.removeFactory(await otherAccount.getAddress())
      ).to.emit(controller6022, "FactoryRemoved");
    });
  });

  describe("pushVault", function () {
    it("Should fail if not called by a reward pool", async function () {
      const { controller6022, otherAccount } =
        await loadFixture(deployController);

      await expect(
        controller6022.pushVault(await otherAccount.getAddress())
      ).to.be.revertedWithCustomError(controller6022, "NotRewardPool");
    });

    it("Should work if called by a reward pool", async function () {
      const { controller6022, otherAccount, owner } =
        await loadFixture(deployController);

      await controller6022.addFactory(await owner.getAddress());
      await controller6022.pushRewardPool(await owner.getAddress());

      await expect(
        controller6022.pushVault(await otherAccount.getAddress())
      ).to.emit(controller6022, "VaultPushed");
    });
  });

  describe("pushRewardPool", function () {
    it("Should fail if not called by factory", async function () {
      const { controller6022, otherAccount } =
        await loadFixture(deployController);

      await expect(
        controller6022
          .connect(otherAccount)
          .pushRewardPool(await otherAccount.getAddress())
      ).to.be.revertedWithCustomError(
        controller6022,
        "AccessControlUnauthorizedAccount"
      );
    });

    it("Should work if called by factory", async function () {
      const { controller6022, otherAccount } =
        await loadFixture(deployController);

      await controller6022.addFactory(await otherAccount.getAddress());

      await expect(
        controller6022
          .connect(otherAccount)
          .pushRewardPool(await otherAccount.getAddress())
      ).to.emit(controller6022, "RewardPoolPushed");
    });
  });

  describe("getVaultsByOwner", function () {
    it("Should work and return one vault", async function () {
      const { controller6022, owner } = await loadFixture(deployController);

      const rewardPool6022 = await deployRewardPool(
        await owner.getAddress(),
        controller6022
      );
      const firstVault = await deployVault(rewardPool6022);

      const vaults = await controller6022.getVaultsByOwner(
        await owner.getAddress()
      );
      expect(vaults.length).to.equal(1);
      expect(vaults[0]).to.equal(await firstVault.getAddress());
    });

    it("Should work and return nothing", async function () {
      const { controller6022, owner, otherAccount } =
        await loadFixture(deployController);

      const rewardPool6022 = await deployRewardPool(
        await owner.getAddress(),
        controller6022
      );
      await deployVault(rewardPool6022);

      const vaults = await controller6022.getVaultsByOwner(
        await otherAccount.getAddress()
      );
      expect(vaults.length).to.equal(0);
    });

    it("Should work and return multiple vaults", async function () {
      const { controller6022, owner, otherAccount } =
        await loadFixture(deployController);

      const rewardPool6022 = await deployRewardPool(
        await owner.getAddress(),
        controller6022
      );
      const firstVault = await deployVault(rewardPool6022);
      const secondVault = await deployVault(rewardPool6022);

      let vaults = await controller6022.getVaultsByOwner(
        await otherAccount.getAddress()
      );
      expect(vaults.length).to.equal(0);

      await firstVault.transferFrom(
        owner.getAddress(),
        otherAccount.getAddress(),
        1
      );
      await secondVault.transferFrom(
        owner.getAddress(),
        otherAccount.getAddress(),
        1
      );

      vaults = await controller6022.getVaultsByOwner(
        await otherAccount.getAddress()
      );
      expect(vaults.length).to.equal(2);
    });
  });
});
