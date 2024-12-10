import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  findEventFromLogs,
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
} from "../utils";
import {
  Token6022,
  RewardPool6022,
  RewardPoolLifetimeVault6022,
} from "../../typechain-types";

describe("When depositing collateral into reward pool lifetime vault", async function () {
  const lifetimeVaultAmount = ethers.parseEther("1");

  let _owner: HardhatEthersSigner;

  let _token6022: Token6022;
  let _rewardPool6022: RewardPool6022;
  let _rewardPoolLifetimeVault: RewardPoolLifetimeVault6022;

  async function deployRewardPoolLifetimeVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

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
    const tx = await rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
    const txReceipt = await tx.wait();
    // But don't use the depositToLifetimeVault method yet (to test not deposited case)

    const rewardPoolLifetimeVault =
      await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      owner,
      token6022,
      rewardPool6022,
      rewardPoolLifetimeVault,
    };
  }

  beforeEach(async function () {
    const { owner, token6022, rewardPool6022, rewardPoolLifetimeVault } =
      await loadFixture(deployRewardPoolLifetimeVault);

    _owner = owner;
    _token6022 = token6022;
    _rewardPool6022 = rewardPool6022;
    _rewardPoolLifetimeVault = rewardPoolLifetimeVault;
  });

  describe("Given caller is not the reward pool", async function () {
    it("Should revert with 'OwnableUnauthorizedAccount' error", async function () {
      await expect(
        _rewardPoolLifetimeVault.deposit()
      ).to.be.revertedWithCustomError(
        _rewardPoolLifetimeVault,
        "OwnableUnauthorizedAccount"
      );
    });
  });

  describe("Given reward pool didn't has the funds to deposit", async function () {
    it("Should revert with 'ERC20InsufficientBalance' error", async function () {
      await expect(
        _rewardPool6022.depositToLifetimeVault()
      ).to.be.revertedWithCustomError(_token6022, "ERC20InsufficientBalance");
    });
  });

  describe("Given already deposited collateral", async function () {
    beforeEach(async function () {
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );

      await _rewardPool6022.depositToLifetimeVault();
    });

    it("Should revert with 'AlreadyDeposited' error", async function () {
      await expect(
        _rewardPool6022.depositToLifetimeVault()
      ).to.be.revertedWithCustomError(
        _rewardPoolLifetimeVault,
        "AlreadyDeposited"
      );
    });
  });

  describe("Given no collateral deposited yet and reward pool has funds to deposit", async function () {
    beforeEach(async function () {
      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
    });

    it("Should emit 'Deposited' event", async function () {
      const tx = await _rewardPool6022.depositToLifetimeVault();
      const txReceipt = await tx.wait();

      const depositedEvents = findEventFromLogs(
        txReceipt!.logs,
        "Deposited(address,uint256)"
      );

      expect(depositedEvents.length).to.equal(1);
    });

    it("Should mark the vault as deposited", async function () {
      await _rewardPool6022.depositToLifetimeVault();

      expect(await _rewardPoolLifetimeVault.isDeposited()).to.be.true;
    });

    it("Should mark the vault as rewardable", async function () {
      await _rewardPool6022.depositToLifetimeVault();

      expect(await _rewardPoolLifetimeVault.isRewardable()).to.be.true;
    });

    it("Should store the wanted amount", async function () {
      await _rewardPool6022.depositToLifetimeVault();

      expect(
        await _token6022.balanceOf(await _rewardPoolLifetimeVault.getAddress())
      ).to.equal(lifetimeVaultAmount);
    });

    it("Should take the collateral from the reward pool", async function () {
      const rewardPoolBalanceOfBefore = await _token6022.balanceOf(
        await _rewardPool6022.getAddress()
      );
      await _rewardPool6022.depositToLifetimeVault();
      const rewardPoolBalanceOfAfter = await _token6022.balanceOf(
        await _rewardPool6022.getAddress()
      );

      const lifetimeVaultBalanceOfAfter = await _token6022.balanceOf(
        await _rewardPoolLifetimeVault.getAddress()
      );

      expect(lifetimeVaultBalanceOfAfter).to.be.equal(
        rewardPoolBalanceOfBefore - rewardPoolBalanceOfAfter
      );
    });
  });
});
