import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Token6022, RewardPoolLifetimeVault6022 } from "../../typechain-types";

describe("When withdrawing collateral from reward pool lifetime vault", async function () {
  const lifetimeVaultAmount = ethers.parseEther("1");

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  let _token6022: Token6022;
  let _rewardPoolLifetimeVault: RewardPoolLifetimeVault6022;

  async function deployRewardPoolLifetimeVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    // Didn't deploy the RewardPoolFactory6022 and a RewardPool6022 contract
    // to directly deploy the RewardPoolLifetimeVault6022 contract
    // Easier to test the RewardPoolLifetimeVault6022 like this
    const RewardPoolLifetimeVault6022 = await ethers.getContractFactory(
      "RewardPoolLifetimeVault6022"
    );

    // Owner is thus considered as a RewardPool (first argument the constructor)
    // Normally the method (createLifetimeVault in RewardPool6022 set himself as RewardPool)
    const rewardPoolLifetimeVault = await RewardPoolLifetimeVault6022.deploy(
      owner.address,
      lifetimeVaultAmount,
      await token6022.getAddress()
    );

    return {
      owner,
      token6022,
      otherAccount,
      rewardPoolLifetimeVault,
    };
  }

  beforeEach(async function () {
    const { owner, token6022, otherAccount, rewardPoolLifetimeVault } =
      await loadFixture(deployRewardPoolLifetimeVault);

    _owner = owner;
    _token6022 = token6022;
    _otherAccount = otherAccount;
    _rewardPoolLifetimeVault = rewardPoolLifetimeVault;
  });

  describe("Given caller is not considered as reward pool", async function () {
    it("Should revert with 'CallerNotRewardPool' error", async function () {
      await expect(
        _rewardPoolLifetimeVault.connect(_otherAccount).withdraw()
      ).to.be.revertedWithCustomError(
        _rewardPoolLifetimeVault,
        "CallerNotRewardPool"
      );
    });
  });

  describe("Given no collateral in the vault", async function () {
    it("Should revert with 'NotDeposited' error", async function () {
      await expect(
        _rewardPoolLifetimeVault.withdraw()
      ).to.be.revertedWithCustomError(_rewardPoolLifetimeVault, "NotDeposited");
    });
  });

  describe("Given vault is already withdrawn", async function () {
    beforeEach(async function () {
      await _token6022.approve(
        await _rewardPoolLifetimeVault.getAddress(),
        lifetimeVaultAmount
      );

      _rewardPoolLifetimeVault.deposit();
      _rewardPoolLifetimeVault.withdraw();
    });

    it("Should revert with 'AlreadyWithdraw' error", async function () {
      await expect(
        _rewardPoolLifetimeVault.withdraw()
      ).to.be.revertedWithCustomError(
        _rewardPoolLifetimeVault,
        "AlreadyWithdraw"
      );
    });
  });

  describe("Given vault can be withdrawn", async function () {
    beforeEach(async function () {
      await _token6022.approve(
        await _rewardPoolLifetimeVault.getAddress(),
        lifetimeVaultAmount
      );

      _rewardPoolLifetimeVault.deposit();
    });

    it("Should send the collateral to the caller", async function () {
      const balanceOfVaultBefore = await _token6022.balanceOf(
        await _rewardPoolLifetimeVault.getAddress()
      );

      const balanceCallerBefore = await _token6022.balanceOf(_owner.address);
      await _rewardPoolLifetimeVault.withdraw();
      const balanceCallerAfter = await _token6022.balanceOf(_owner.address);

      expect(balanceCallerAfter).to.be.equal(
        balanceOfVaultBefore + balanceCallerBefore
      );
    });

    it("Should not keep collateral", async function () {
      await _rewardPoolLifetimeVault.withdraw();

      expect(
        await _token6022.balanceOf(await _rewardPoolLifetimeVault.getAddress())
      ).to.be.equal(BigInt(0));
    });

    it("Should mark the vault as withdrawn", async function () {
      await _rewardPoolLifetimeVault.withdraw();

      expect(await _rewardPoolLifetimeVault.isWithdrawn()).to.be.true;
    });

    it("Should emit 'Withdrawn' event", async function () {
      expect(await _rewardPoolLifetimeVault.withdraw()).to.emit(
        _rewardPoolLifetimeVault,
        "Withdrawn"
      );
    });
  });
});
