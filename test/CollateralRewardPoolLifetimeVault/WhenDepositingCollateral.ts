import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  findEventFromLogs,
  computeFeesFromCollateralWithFees,
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
} from "../utils";
import {
  MockERC20,
  CollateralRewardPool,
  CollateralRewardPoolLifetimeVault,
} from "../../typechain-types";

describe("When depositing collateral into reward pool lifetime vault", async function () {
  const lifetimeVaultAmount = ethers.parseEther("1");

  let _owner: HardhatEthersSigner;

  let _token: MockERC20;
  let _rewardPool: CollateralRewardPool;
  let _rewardPoolLifetimeVault: CollateralRewardPoolLifetimeVault;

  async function deployRewardPoolLifetimeVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const CollateralController = await ethers.getContractFactory("CollateralController");
    const controller = await CollateralController.deploy();

    // Didn't deploy the CollateralRewardPoolFactory
    // In order to test the deposit (CollateralRewardPoolFactory directly calls the deposit method)
    const CollateralRewardPool = await ethers.getContractFactory("CollateralRewardPool");
    const rewardPool = await CollateralRewardPool.deploy(
      await owner.getAddress(),
      await controller.getAddress(),
      await token.getAddress()
    );

    await controller.addFactory(await owner.getAddress());
    await controller.pushRewardPool(await rewardPool.getAddress());
    await controller.removeFactory(await owner.getAddress());

    // Create the lifetime vault using the CollateralRewardPool
    const tx = await rewardPool.createLifetimeVault(lifetimeVaultAmount);
    const txReceipt = await tx.wait();
    // But don't use the depositToLifetimeVault method yet (to test not deposited case)

    const rewardPoolLifetimeVault =
      await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      owner,
      token,
      rewardPool,
      rewardPoolLifetimeVault,
    };
  }

  beforeEach(async function () {
    const { owner, token, rewardPool, rewardPoolLifetimeVault } =
      await loadFixture(deployRewardPoolLifetimeVault);

    _owner = owner;
    _token = token;
    _rewardPool = rewardPool;
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
        _rewardPool.depositToLifetimeVault()
      ).to.be.revertedWithCustomError(_token, "ERC20InsufficientBalance");
    });
  });

  describe("Given already deposited collateral", async function () {
    beforeEach(async function () {
      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount
      );

      await _rewardPool.depositToLifetimeVault();
    });

    it("Should revert with 'AlreadyDeposited' error", async function () {
      await expect(
        _rewardPool.depositToLifetimeVault()
      ).to.be.revertedWithCustomError(
        _rewardPoolLifetimeVault,
        "AlreadyDeposited"
      );
    });
  });

  describe("Given no collateral deposited yet and reward pool has funds to deposit", async function () {
    beforeEach(async function () {
      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount
      );
    });

    it("Should emit 'Deposited' event", async function () {
      const tx = await _rewardPool.depositToLifetimeVault();
      const txReceipt = await tx.wait();

      const depositedEvents = findEventFromLogs(
        txReceipt!.logs,
        "Deposited(address,uint256)"
      );

      expect(depositedEvents.length).to.equal(1);
    });

    it("Should mark the vault as deposited", async function () {
      await _rewardPool.depositToLifetimeVault();

      expect(await _rewardPoolLifetimeVault.isDeposited()).to.be.true;
    });

    it("Should mark the vault as rewardable", async function () {
      await _rewardPool.depositToLifetimeVault();

      expect(await _rewardPoolLifetimeVault.isRewardable()).to.be.true;
    });

    it("Should store the wanted amount less fees", async function () {
      await _rewardPool.depositToLifetimeVault();

      const expectedFees =
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      expect(
        await _token.balanceOf(await _rewardPoolLifetimeVault.getAddress())
      ).to.equal(lifetimeVaultAmount - expectedFees);
    });

    it("Should take the collateral from the reward pool", async function () {
      const rewardPoolBalanceOfBefore = await _token.balanceOf(
        await _rewardPool.getAddress()
      );
      await _rewardPool.depositToLifetimeVault();
      const rewardPoolBalanceOfAfter = await _token.balanceOf(
        await _rewardPool.getAddress()
      );

      const lifetimeVaultBalanceOfAfter = await _token.balanceOf(
        await _rewardPoolLifetimeVault.getAddress()
      );

      expect(lifetimeVaultBalanceOfAfter).to.be.equal(
        rewardPoolBalanceOfBefore - rewardPoolBalanceOfAfter
      );
    });
  });
});
