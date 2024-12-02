import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { RewardPool6022, Token6022 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When creating vault from reward pool 6022", function () {
  const lockedDuring = 60 * 60 * 24;
  const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;

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
            ethers.parseEther("1"),
            await _rewardPool6022.protocolToken(),
            BigInt(0),
            ethers.parseEther("1")
          )
      ).to.revertedWithCustomError(
        _rewardPool6022,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Given no rewardable vaults in the pool", async function () {
    const lockedUntil = Date.now() + 1000 * 60 * 60;

    it("Should emit 'VaultCreated' event", async function () {
      await expect(
        _rewardPool6022.createVault(
          "TestVault",
          lockedUntil,
          ethers.parseEther("1"),
          await _rewardPool6022.protocolToken(),
          BigInt(0),
          ethers.parseEther("1")
        )
      ).to.emit(_rewardPool6022, "VaultCreated");
    });

    it("Should increase reward weight", async function () {
      await _rewardPool6022.createVault(
        "TestVault",
        lockedUntil,
        ethers.parseEther("1"),
        await _rewardPool6022.protocolToken(),
        BigInt(0),
        ethers.parseEther("1")
      );

      const vaultAddress = await _rewardPool6022.allVaults(0);

      expect(
        await _rewardPool6022.vaultsRewardWeight(vaultAddress)
      ).to.be.greaterThan(0);
    });
  });

  describe("Given rewardable vaults in the pool", async function () {
    describe("And the caller has not approved the token 6022 usage", async function () {
      it("Should revert with 'ERC20InsufficientAllowance' error", async function () {
        const lockedUntil = Date.now() + 1000 * 60 * 60;

        // This one should work because the first time the reward pool didn't take fees
        await _rewardPool6022.createVault(
          "TestVault",
          lockedUntil,
          ethers.parseEther("1"),
          await _rewardPool6022.protocolToken(),
          BigInt(0),
          ethers.parseEther("1")
        );

        // Make deposit in the first vault to set it to "rewardable"
        const firstVaultAddress = await _rewardPool6022.allVaults(0);
        const firstVault = await ethers.getContractAt(
          "Vault6022",
          firstVaultAddress
        );

        await _token6022.approve(firstVaultAddress, ethers.parseEther("1"));
        await firstVault.deposit();

        await expect(
          _rewardPool6022.createVault(
            "TestVault",
            lockedUntil,
            ethers.parseEther("1"),
            await _rewardPool6022.protocolToken(),
            BigInt(0),
            ethers.parseEther("1")
          )
        ).to.be.revertedWithCustomError(
          _token6022,
          "ERC20InsufficientAllowance"
        );
      });
    });

    describe("And the caller has approved the token 6022 usage", async function () {
      const lockedUntil = Date.now() + 1000 * 60 * 60;

      beforeEach(async function () {
        await _token6022.approve(
          await _rewardPool6022.getAddress(),
          ethers.parseEther("100000")
        );

        await _rewardPool6022.createVault(
          "TestVault",
          lockedUntil,
          ethers.parseEther("1"),
          await _rewardPool6022.protocolToken(),
          BigInt(0),
          ethers.parseEther("1")
        );

        // Make deposit in the first vault to set it to "rewardable"
        const firstVaultAddress = await _rewardPool6022.allVaults(0);
        const firstVault = await ethers.getContractAt(
          "Vault6022",
          firstVaultAddress
        );

        await _token6022.approve(firstVaultAddress, ethers.parseEther("1"));
        await firstVault.deposit();
      });

      it("Should emit 'VaultCreated' event", async function () {
        await expect(
          _rewardPool6022.createVault(
            "TestVault",
            Math.floor(lockedUntil),
            ethers.parseEther("1"),
            await _rewardPool6022.protocolToken(),
            BigInt(0),
            ethers.parseEther("1")
          )
        ).to.emit(_rewardPool6022, "VaultCreated");
      });

      it("Should increase reward weight", async function () {
        await _rewardPool6022.createVault(
          "TestVault",
          Math.floor(lockedUntil),
          ethers.parseEther("1"),
          await _rewardPool6022.protocolToken(),
          BigInt(0),
          ethers.parseEther("1")
        );

        const vaultAddress = await _rewardPool6022.allVaults(1);

        expect(
          await _rewardPool6022.vaultsRewardWeight(vaultAddress)
        ).to.be.greaterThan(0);
      });
    });
  });
});
