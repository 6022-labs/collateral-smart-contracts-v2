import { expect } from "chai";
import { ethers } from "hardhat";
import { RewardPool6022, MockERC20 } from "../../typechain-types";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  computeFeesFromCollateralWithFees,
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
} from "../utils";

describe("When creating lifetime vault from reward pool 6022", async function () {
  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token6022: MockERC20;
  let _rewardPool6022: RewardPool6022;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployRewardPool() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token6022 = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    // Deploy directly a RewardPool6022 instead of using a RewardPoolFactory6022
    // To be able to test more case (RewardPoolFactory6022 automatically create the lifetime vault...)
    const RewardPool6022 = await ethers.getContractFactory("RewardPool6022");
    const rewardPool6022 = await RewardPool6022.deploy(
      await owner.getAddress(),
      await controller6022.getAddress(),
      await token6022.getAddress()
    );

    await controller6022.addFactory(await owner.getAddress());
    await controller6022.pushRewardPool(await rewardPool6022.getAddress());
    await controller6022.removeFactory(await owner.getAddress());

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

  describe("Given lifetime vault already exist", async function () {
    beforeEach(async function () {
      await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
    });

    it("Should revert with 'LifeTimeVaultAlreadyExist' error", async function () {
      await expect(
        _rewardPool6022.createLifetimeVault(lifetimeVaultAmount)
      ).to.be.revertedWithCustomError(
        _rewardPool6022,
        "LifeTimeVaultAlreadyExist"
      );
    });
  });

  describe("Given lifetime vault does not exist", async function () {
    it("Should emit 'VaultCreated' event", async function () {
      await expect(
        await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount)
      ).to.emit(_rewardPool6022, "VaultCreated");
    });

    it("Should push the lifetime vault in all vaults", async function () {
      await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);

      expect(await _rewardPool6022.allVaults(0)).to.eq(
        await _rewardPool6022.lifetimeVault()
      );
    });

    it("Should set the wanted amount as the desired amount minus the fees", async function () {
      const expectedWantedAmount =
        lifetimeVaultAmount -
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      const tx = await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
      const txReceipt = await tx.wait();

      const lifetimeVault =
        await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(txReceipt!.logs);

      expect(await lifetimeVault.wantedAmount()).to.be.equal(
        expectedWantedAmount
      );
    });

    it("Should mark the lifetime vault as a vault", async function () {
      await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);

      expect(
        await _rewardPool6022.isVault(await _rewardPool6022.lifetimeVault())
      ).to.be.true;
    });
  });
});
