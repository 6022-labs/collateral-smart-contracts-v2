import { expect } from "chai";
import { ethers } from "hardhat";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  Controller6022,
  RewardPool6022,
  Vault6022,
} from "../../typechain-types";
import { EventLog } from "ethers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("When getting vaults by owner from controller 6022", function () {
  let _controller6022: Controller6022;
  let _rewardPool6022: RewardPool6022;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployController() {
    await reset();

    const [owner, otherAccount] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const rewardPool6022 = await deployRewardPool(
      await owner.getAddress(),
      controller6022
    );

    return {
      controller6022,
      rewardPool6022,
      otherAccount,
      owner,
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

  beforeEach(async function () {
    const { controller6022, rewardPool6022, owner, otherAccount } =
      await loadFixture(deployController);

    _owner = owner;
    _otherAccount = otherAccount;
    _controller6022 = controller6022;
    _rewardPool6022 = rewardPool6022;
  });

  describe("Given no vaults were created", function () {
    it("Should return empty", async function () {
      const vaults = await _controller6022.getVaultsByOwner(
        await _otherAccount.getAddress()
      );
      expect(vaults.length).to.equal(0);
    });
  });

  describe("Given one vault was created", function () {
    let _createdVault: Vault6022;

    beforeEach(async function () {
      _createdVault = await deployVault(_rewardPool6022);
    });

    it("Should return one vault", async function () {
      const vaults = await _controller6022.getVaultsByOwner(
        await _owner.getAddress()
      );
      expect(vaults.length).to.equal(1);
      expect(vaults[0]).to.equal(await _createdVault.getAddress());
    });
  });

  describe("Given multiple vaults were created", function () {
    let _createdVaults: Vault6022[];

    beforeEach(async function () {
      const firstVault = await deployVault(_rewardPool6022);
      const secondVault = await deployVault(_rewardPool6022);

      _createdVaults = [firstVault, secondVault];
    });

    it("Should return multiple vaults", async function () {
      const vaults = await _controller6022.getVaultsByOwner(
        await _owner.getAddress()
      );
      expect(vaults.length).to.equal(2);
      expect(vaults[0]).to.equal(await _createdVaults[0].getAddress());
      expect(vaults[1]).to.equal(await _createdVaults[1].getAddress());
    });
  });
});
