import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  computeFeesFromCollateralWithFees,
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
} from "../utils";
import {
  MockERC20,
  CollateralRewardPool,
  CollateralRewardPoolLifetimeVault,
} from "../../typechain-types";

describe("When depositing to lifetime vault", async function () {
  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token: MockERC20;
  let _rewardPool: CollateralRewardPool;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployRewardPool() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const CollateralController = await ethers.getContractFactory("CollateralController");
    const controller = await CollateralController.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    // Deploy directly a CollateralRewardPool instead of using a CollateralRewardPoolFactory
    // To be able to test more case (CollateralRewardPoolFactory automatically create the lifetime vault...)
    const CollateralRewardPool = await ethers.getContractFactory("CollateralRewardPool");
    const rewardPool = await CollateralRewardPool.deploy(
      await owner.getAddress(),
      await controller.getAddress(),
      await token.getAddress()
    );

    await controller.addFactory(await owner.getAddress());
    await controller.pushRewardPool(await rewardPool.getAddress());
    await controller.removeFactory(await owner.getAddress());

    return { token, rewardPool, owner, otherAccount };
  }

  beforeEach(async function () {
    const { token, rewardPool, owner, otherAccount } =
      await loadFixture(deployRewardPool);

    _token = token;
    _rewardPool = rewardPool;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given lifetime vault does not exist", async function () {
    it("Should revert with 'LifeTimeVaultDoesNotExist' error", async function () {
      await expect(
        _rewardPool.depositToLifetimeVault()
      ).to.be.revertedWithCustomError(
        _rewardPool,
        "LifeTimeVaultDoesNotExist"
      );
    });
  });

  describe("Given reward pool didn't had enough funds to deposit", async function () {
    beforeEach(async function () {
      await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
    });

    it("Should revert with 'ERC20InsufficientBalance' error", async function () {
      await expect(
        _rewardPool.depositToLifetimeVault()
      ).to.be.revertedWithCustomError(_token, "ERC20InsufficientBalance");
    });
  });

  describe("Given collateral in lifetime vault is already deposited", async function () {
    let _lifetimeVault: CollateralRewardPoolLifetimeVault;

    beforeEach(async function () {
      const tx = await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
      const txReceipt = await tx.wait();

      _lifetimeVault = await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(
        txReceipt!.logs
      );

      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool.depositToLifetimeVault();
    });

    it("Should revert with 'AlreadyDeposited' error", async function () {
      await expect(
        _rewardPool.depositToLifetimeVault()
      ).to.be.revertedWithCustomError(_lifetimeVault, "AlreadyDeposited");
    });
  });

  describe("Given lifetime vault can be deposited", async function () {
    let _lifetimeVault: CollateralRewardPoolLifetimeVault;

    beforeEach(async function () {
      const tx = await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
      const txReceipt = await tx.wait();

      _lifetimeVault = await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(
        txReceipt!.logs
      );

      await _token.transfer(
        await _rewardPool.getAddress(),
        lifetimeVaultAmount
      );
    });

    it("Should emit 'Deposited' event", async function () {
      await expect(_rewardPool.depositToLifetimeVault()).to.emit(
        _lifetimeVault,
        "Deposited"
      );
    });

    it("Should mark the lifetime vault as deposited", async function () {
      await _rewardPool.depositToLifetimeVault();

      expect(await _lifetimeVault.isDeposited()).to.be.true;
    });

    it("Should keep the fees", async function () {
      const expectedFees =
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      await _rewardPool.depositToLifetimeVault();

      expect(
        await _token.balanceOf(await _rewardPool.getAddress())
      ).to.be.equal(expectedFees);
    });

    it("Should take the collateral from the reward pool", async function () {
      const rewardPoolBalanceOfBefore = await _token.balanceOf(
        await _rewardPool.getAddress()
      );
      await _rewardPool.depositToLifetimeVault();
      const rewardPoolBalanceOfAfter = await _token.balanceOf(
        await _rewardPool.getAddress()
      );

      const lifetimeVaultWantedAmount = await _lifetimeVault.wantedAmount();

      expect(rewardPoolBalanceOfAfter).to.be.equal(
        rewardPoolBalanceOfBefore - lifetimeVaultWantedAmount
      );
    });

    it("Should increase the reward weight of the lifetime vault", async function () {
      const expectedRewardWeight =
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      await _rewardPool.depositToLifetimeVault();

      expect(
        await _rewardPool.vaultsRewardWeight(
          await _lifetimeVault.getAddress()
        )
      ).to.be.equal(expectedRewardWeight);
    });

    it("Should assign fees to the lifetime vault", async function () {
      const expectedFees =
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      await _rewardPool.depositToLifetimeVault();

      expect(
        await _rewardPool.collectedRewards(
          await _lifetimeVault.getAddress()
        )
      ).to.be.equal(expectedFees);
    });
  });
});
