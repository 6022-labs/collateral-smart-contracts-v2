import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import {
  computeFeesFromCollateralWithFees,
  parseRewardPoolLifetimeVaultFromVaultCreatedLogs,
} from "../utils";
import {
  Token6022,
  RewardPool6022,
  RewardPoolLifetimeVault6022,
} from "../../typechain-types";

describe("When depositing to lifetime vault", async function () {
  const lifetimeVaultAmount = ethers.parseEther("1");

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

  describe("Given lifetime vault does not exist", async function () {
    it("Should revert with 'LifeTimeVaultDoesNotExist' error", async function () {
      await expect(
        _rewardPool6022.depositToLifetimeVault()
      ).to.be.revertedWithCustomError(
        _rewardPool6022,
        "LifeTimeVaultDoesNotExist"
      );
    });
  });

  describe("Given reward pool didn't had enough funds to deposit", async function () {
    beforeEach(async function () {
      await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
    });

    it("Should revert with 'ERC20InsufficientBalance' error", async function () {
      await expect(
        _rewardPool6022.depositToLifetimeVault()
      ).to.be.revertedWithCustomError(_token6022, "ERC20InsufficientBalance");
    });
  });

  describe("Given collateral in lifetime vault is already deposited", async function () {
    let _lifetimeVault: RewardPoolLifetimeVault6022;

    beforeEach(async function () {
      const tx = await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
      const txReceipt = await tx.wait();

      _lifetimeVault = await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(
        txReceipt!.logs
      );

      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPool6022.depositToLifetimeVault();
    });

    it("Should revert with 'AlreadyDeposited' error", async function () {
      await expect(
        _rewardPool6022.depositToLifetimeVault()
      ).to.be.revertedWithCustomError(_lifetimeVault, "AlreadyDeposited");
    });
  });

  describe("Given lifetime vault can be deposited", async function () {
    let _lifetimeVault: RewardPoolLifetimeVault6022;

    beforeEach(async function () {
      const tx = await _rewardPool6022.createLifetimeVault(lifetimeVaultAmount);
      const txReceipt = await tx.wait();

      _lifetimeVault = await parseRewardPoolLifetimeVaultFromVaultCreatedLogs(
        txReceipt!.logs
      );

      await _token6022.transfer(
        await _rewardPool6022.getAddress(),
        lifetimeVaultAmount
      );
    });

    it("Should emit 'Deposited' event", async function () {
      await expect(_rewardPool6022.depositToLifetimeVault()).to.emit(
        _lifetimeVault,
        "Deposited"
      );
    });

    it("Should mark the lifetime vault as deposited", async function () {
      await _rewardPool6022.depositToLifetimeVault();

      expect(await _lifetimeVault.isDeposited()).to.be.true;
    });

    it("Should keep the fees", async function () {
      const expectedFees =
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      await _rewardPool6022.depositToLifetimeVault();

      expect(
        await _token6022.balanceOf(await _rewardPool6022.getAddress())
      ).to.be.equal(expectedFees);
    });

    it("Should take the collateral from the reward pool", async function () {
      const rewardPoolBalanceOfBefore = await _token6022.balanceOf(
        await _rewardPool6022.getAddress()
      );
      await _rewardPool6022.depositToLifetimeVault();
      const rewardPoolBalanceOfAfter = await _token6022.balanceOf(
        await _rewardPool6022.getAddress()
      );

      const lifetimeVaultWantedAmount = await _lifetimeVault.wantedAmount();

      expect(rewardPoolBalanceOfAfter).to.be.equal(
        rewardPoolBalanceOfBefore - lifetimeVaultWantedAmount
      );
    });

    it("Should increase the reward weight of the lifetime vault", async function () {
      const expectedRewardWeight =
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      await _rewardPool6022.depositToLifetimeVault();

      expect(
        await _rewardPool6022.vaultsRewardWeight(
          await _lifetimeVault.getAddress()
        )
      ).to.be.equal(expectedRewardWeight);
    });

    it("Should assign fees to the lifetime vault", async function () {
      const expectedFees =
        computeFeesFromCollateralWithFees(lifetimeVaultAmount);

      await _rewardPool6022.depositToLifetimeVault();

      expect(
        await _rewardPool6022.collectedRewards(
          await _lifetimeVault.getAddress()
        )
      ).to.be.equal(expectedFees);
    });
  });
});
