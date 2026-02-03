import { expect } from "chai";
import { ethers } from "hardhat";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  Controller,
  RewardPool,
  Vault,
} from "../../typechain-types";
import { EventLog } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("When getting vaults by owner from controller 6022", function () {
  const lifetimeVaultAmount = ethers.parseEther("1");

  let _controller: Controller;
  let _rewardPool: RewardPool;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployController() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const Controller = await ethers.getContractFactory("Controller");
    const controller = await Controller.deploy();

    const rewardPool = await deployRewardPool(
      await owner.getAddress(),
      controller
    );

    return {
      controller,
      rewardPool,
      otherAccount,
      owner,
    };
  }

  async function deployRewardPool(
    ownerAddress: string,
    controller: Controller
  ) {
    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      ownerAddress,
      ethers.parseEther("100000")
    );

    const RewardPoolFactory = await ethers.getContractFactory(
      "RewardPoolFactory"
    );
    const rewardPoolFactory = await RewardPoolFactory.deploy(
      await controller.getAddress(),
      await token.getAddress()
    );

    await controller.addFactory(await rewardPoolFactory.getAddress());

    await token.approve(
      await rewardPoolFactory.getAddress(),
      lifetimeVaultAmount
    );

    const tx = await rewardPoolFactory.createRewardPool(
      lifetimeVaultAmount
    );

    const txReceipt = await tx.wait();

    const events = <EventLog[]>(
      txReceipt?.logs.filter((x) => x instanceof EventLog)
    );
    const rewardPoolCreatedEvent = events.filter(
      (x) =>
        x.fragment.name ===
        rewardPoolFactory.filters["RewardPoolCreated(address)"].name
    )[0];

    const RewardPool = await ethers.getContractFactory("RewardPool");
    const rewardPool = RewardPool.attach(
      rewardPoolCreatedEvent.args[0]
    ) as RewardPool;

    await token.approve(
      await rewardPool.getAddress(),
      ethers.parseEther("100000")
    );

    return rewardPool;
  }

  async function deployVault(rewardPool: RewardPool) {
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

    const Vault = await ethers.getContractFactory("Vault");
    return Vault.attach(vaultCreatedEvent.args[0]) as Vault;
  }

  beforeEach(async function () {
    const { controller, rewardPool, owner, otherAccount } =
      await loadFixture(deployController);

    _owner = owner;
    _otherAccount = otherAccount;
    _controller = controller;
    _rewardPool = rewardPool;
  });

  describe("Given no vaults were created", function () {
    it("Should return empty", async function () {
      const vaults = await _controller.getVaultsByOwner(
        await _otherAccount.getAddress()
      );
      expect(vaults.length).to.equal(0);
    });
  });

  describe("Given one vault was created", function () {
    let _createdVault: Vault;

    beforeEach(async function () {
      _createdVault = await deployVault(_rewardPool);
    });

    it("Should return one vault", async function () {
      const vaults = await _controller.getVaultsByOwner(
        await _owner.getAddress()
      );
      expect(vaults.length).to.equal(1);
      expect(vaults[0]).to.equal(await _createdVault.getAddress());
    });
  });

  describe("Given multiple vaults were created", function () {
    let _createdVaults: Vault[];

    beforeEach(async function () {
      const firstVault = await deployVault(_rewardPool);
      const secondVault = await deployVault(_rewardPool);

      _createdVaults = [firstVault, secondVault];
    });

    it("Should return multiple vaults", async function () {
      const vaults = await _controller.getVaultsByOwner(
        await _owner.getAddress()
      );
      expect(vaults.length).to.equal(2);
      expect(vaults[0]).to.equal(await _createdVaults[0].getAddress());
      expect(vaults[1]).to.equal(await _createdVaults[1].getAddress());
    });
  });
});
