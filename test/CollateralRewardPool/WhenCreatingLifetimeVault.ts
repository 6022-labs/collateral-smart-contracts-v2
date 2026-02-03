import { expect } from "chai";
import { ethers } from "hardhat";
import { CollateralRewardPool, MockERC20 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  computeFeesFromCollateralWithFees,
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
} from "../utils";

describe("When creating lifetime vault from reward pool 6022", async function () {
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

  describe("Given lifetime vault already exist", async function () {
    beforeEach(async function () {
      await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
    });

    it("Should revert with 'LifeTimeVaultAlreadyExist' error", async function () {
      await expect(
        _rewardPool.createLifetimeVault(lifetimeVaultAmount)
      ).to.be.revertedWithCustomError(
        _rewardPool,
        "LifeTimeVaultAlreadyExist"
      );
    });
  });

  describe("Given lifetime vault does not exist", async function () {
    it("Should emit 'VaultCreated' event", async function () {
      await expect(
        await _rewardPool.createLifetimeVault(lifetimeVaultAmount)
      ).to.emit(_rewardPool, "VaultCreated");
    });

    it("Should push the lifetime vault in all vaults", async function () {
      await _rewardPool.createLifetimeVault(lifetimeVaultAmount);

      expect(await _rewardPool.allVaults(0)).to.eq(
        await _rewardPool.lifetimeVault()
      );
    });

    it("Should set the wanted amount as the desired amount minus the fees", async function () {
      const expectedWantedAmount =
        lifetimeVaultAmount -
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      const tx = await _rewardPool.createLifetimeVault(lifetimeVaultAmount);
      const txReceipt = await tx.wait();

      const lifetimeVault =
        await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await lifetimeVault.wantedAmount()).to.be.equal(
        expectedWantedAmount
      );
    });

    it("Should mark the lifetime vault as a vault", async function () {
      await _rewardPool.createLifetimeVault(lifetimeVaultAmount);

      expect(
        await _rewardPool.isVault(await _rewardPool.lifetimeVault())
      ).to.be.true;
    });
  });
});
