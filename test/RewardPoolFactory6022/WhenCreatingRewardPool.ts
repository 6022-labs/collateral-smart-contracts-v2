import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  MockERC20,
  RewardPoolFactory6022,
  Controller6022,
} from "../../typechain-types";
import {
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-toolbox/network-helpers";
import {
  computeFeesFromCollateralWithFees,
  findEventFromLogs,
  logsToLogDescriptions,
  parseRewardPoolFromRewardPoolCreatedLogs,
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
} from "../utils";

describe("When creating reward pool from factory 6022", function () {
  const lifetimeVaultAmount = ethers.parseEther("1");

  let _owner: HardhatEthersSigner;

  let _token6022: MockERC20;
  let _controller6022: Controller6022;
  let _rewardPoolFactory6022: RewardPoolFactory6022;

  async function deployRewardPoolFactory() {
    await reset();

    const [owner] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token6022 = await MockERC20.deploy(
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

    return {
      owner,
      token6022,
      controller6022,
      rewardPoolFactory6022,
    };
  }

  beforeEach(async function () {
    const { owner, token6022, controller6022, rewardPoolFactory6022 } =
      await loadFixture(deployRewardPoolFactory);

    _owner = owner;
    _token6022 = token6022;
    _controller6022 = controller6022;
    _rewardPoolFactory6022 = rewardPoolFactory6022;
  });

  describe("Given caller already has a reward pool", async function () {
    beforeEach(async function () {
      await _token6022.approve(
        await _rewardPoolFactory6022.getAddress(),
        lifetimeVaultAmount
      );

      await _rewardPoolFactory6022.createRewardPool(lifetimeVaultAmount);
    });

    it("Should revert with 'AlreadyCreatedRewardPool' error", async function () {
      await expect(
        _rewardPoolFactory6022.createRewardPool(lifetimeVaultAmount)
      ).to.be.revertedWithCustomError(
        _rewardPoolFactory6022,
        "AlreadyCreatedRewardPool"
      );
    });
  });

  describe("Given caller didn't approve protocol token", async function () {
    it("Should revert with 'ERC20InsufficientAllowance' error", async function () {
      await expect(
        _rewardPoolFactory6022.createRewardPool(lifetimeVaultAmount)
      ).to.be.revertedWithCustomError(_token6022, "ERC20InsufficientAllowance");
    });
  });

  describe("Given caller approve protocol token and don't have a reward pool", async function () {
    beforeEach(async function () {
      await _token6022.approve(
        await _rewardPoolFactory6022.getAddress(),
        lifetimeVaultAmount
      );
    });

    it("Should emit 'RewardPoolCreated' event", async function () {
      await expect(
        _rewardPoolFactory6022.createRewardPool(lifetimeVaultAmount)
      ).to.emit(_rewardPoolFactory6022, "RewardPoolCreated");
    });

    it("Should emit 'VaultCreated' event", async function () {
      const tx = await _rewardPoolFactory6022.createRewardPool(
        lifetimeVaultAmount
      );
      const txReceipt = await tx.wait();

      const vaultCreatedEvents = findEventFromLogs(
        txReceipt!.logs,
        "VaultCreated(address)"
      );

      expect(vaultCreatedEvents).to.be.lengthOf(1);
    });

    it("Should emit 'Deposited' event", async function () {
      const tx = await _rewardPoolFactory6022.createRewardPool(
        lifetimeVaultAmount
      );
      const txReceipt = await tx.wait();

      const vaultCreatedEvents = findEventFromLogs(
        txReceipt!.logs,
        "Deposited(address,uint256)"
      );

      expect(vaultCreatedEvents).to.be.lengthOf(1);
    });

    it("Should emit 'RewardPoolPushed' event", async function () {
      await expect(
        _rewardPoolFactory6022.createRewardPool(lifetimeVaultAmount)
      ).to.emit(_controller6022, "RewardPoolPushed");
    });

    it("Should add the created reward pool to the controller", async function () {
      const tx = await _rewardPoolFactory6022.createRewardPool(
        lifetimeVaultAmount
      );
      const txReceipt = await tx.wait();

      const createdRewardPool = await parseRewardPoolFromRewardPoolCreatedLogs(
        txReceipt!.logs
      );

      expect(
        await _controller6022.isRewardPool(await createdRewardPool.getAddress())
      ).to.be.true;
    });

    // Don't store the lifetime vault into the controller, we can easily found them by fetching reward pools.
    it("Should not push the lifetime vault into the controller", async function () {
      await expect(
        _rewardPoolFactory6022.createRewardPool(lifetimeVaultAmount)
      ).to.not.emit(_controller6022, "VaultPushed");
    });

    it("Should store the lifetime vault wanted amount into the lifetime vault", async function () {
      const tx = await _rewardPoolFactory6022.createRewardPool(
        lifetimeVaultAmount
      );
      const txReceipt = await tx.wait();

      const vaultCreatedEvents = await logsToLogDescriptions(
        txReceipt!.logs,
        "VaultCreated(address)",
        "RewardPool6022"
      );

      const lifetimeVaultAddress = vaultCreatedEvents[0].args[0];

      const expectedAmount =
        lifetimeVaultAmount -
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      expect(await _token6022.balanceOf(lifetimeVaultAddress)).to.be.equal(
        expectedAmount
      );
    });

    it("Should store the lifetime vault fees into the reward pool", async function () {
      const tx = await _rewardPoolFactory6022.createRewardPool(
        lifetimeVaultAmount
      );
      const txReceipt = await tx.wait();

      const rewardPool = await parseRewardPoolFromRewardPoolCreatedLogs(
        txReceipt!.logs
      );

      const expectedAmount =
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      expect(
        await _token6022.balanceOf(await rewardPool.getAddress())
      ).to.be.equal(expectedAmount);
    });

    it("Should mark the lifetime vault as deposited", async function () {
      const tx = await _rewardPoolFactory6022.createRewardPool(
        lifetimeVaultAmount
      );
      const txReceipt = await tx.wait();

      const lifetimeVault =
        await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await lifetimeVault.isDeposited()).to.be.true;
    });

    it("Should set the lifetime vault as rewardable", async function () {
      const tx = await _rewardPoolFactory6022.createRewardPool(
        lifetimeVaultAmount
      );
      const txReceipt = await tx.wait();

      const lifetimeVault =
        await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await lifetimeVault.isRewardable()).to.be.true;
    });

    it("Should take the collateral of the lifetime vault from the caller", async function () {
      const callerBalanceOfBefore = await _token6022.balanceOf(_owner.address);
      const tx = await _rewardPoolFactory6022.createRewardPool(
        lifetimeVaultAmount
      );
      const txReceipt = await tx.wait();

      const vaultCreatedEvents = await logsToLogDescriptions(
        txReceipt!.logs,
        "VaultCreated(address)",
        "RewardPool6022"
      );

      const lifetimeVaultAddress = vaultCreatedEvents[0].args[0];

      const callerBalanceOfAfter = await _token6022.balanceOf(_owner.address);
      const vaultBalanceOfAfter = await _token6022.balanceOf(
        lifetimeVaultAddress
      );

      const expectedFees =
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      expect(vaultBalanceOfAfter).to.be.equal(
        callerBalanceOfBefore - callerBalanceOfAfter - expectedFees
      );
    });

    it("Should take the fees of the lifetime vault from the caller", async function () {
      const tx = await _rewardPoolFactory6022.createRewardPool(
        lifetimeVaultAmount
      );
      const txReceipt = await tx.wait();

      const rewardPool = await parseRewardPoolFromRewardPoolCreatedLogs(
        txReceipt!.logs
      );

      const rewardPoolBalanceOfAfter = await _token6022.balanceOf(
        await rewardPool.getAddress()
      );

      const expectedFees =
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      expect(rewardPoolBalanceOfAfter).to.be.equal(expectedFees);
    });

    it("Should increase the reward weight for lifetime vault", async function () {
      const tx = await _rewardPoolFactory6022.createRewardPool(
        lifetimeVaultAmount
      );
      const txReceipt = await tx.wait();

      const rewardPool = await parseRewardPoolFromRewardPoolCreatedLogs(
        txReceipt!.logs
      );

      const vaultCreatedEvents = await logsToLogDescriptions(
        txReceipt!.logs,
        "VaultCreated(address)",
        "RewardPool6022"
      );
      const lifetimeVaultAddress = vaultCreatedEvents[0].args[0];

      const expectedRewardWeight =
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      expect(
        await rewardPool.vaultsRewardWeight(lifetimeVaultAddress)
      ).to.be.equal(expectedRewardWeight);
    });

    it("Should create a reward pool able to create a vault", async function () {
      const lockedDuring = 60 * 60 * 24;
      const lockedUntil = Math.floor(Date.now() / 1000) + lockedDuring;
      const wantedAmountInTheVault = ethers.parseEther("1");

      const tx = await _rewardPoolFactory6022.createRewardPool(
        lifetimeVaultAmount
      );
      const txReceipt = await tx.wait();

      const rewardPool = await parseRewardPoolFromRewardPoolCreatedLogs(
        txReceipt!.logs
      );

      expect(
        rewardPool.createVault(
          "TestVault",
          lockedUntil,
          wantedAmountInTheVault,
          await _token6022.getAddress(),
          BigInt(0),
          wantedAmountInTheVault
        )
      ).to.emit(rewardPool, "VaultCreated");
    });
  });
});
