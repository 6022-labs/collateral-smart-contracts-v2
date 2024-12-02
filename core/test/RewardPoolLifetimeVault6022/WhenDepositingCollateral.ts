import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { Token6022, RewardPoolLifetimeVault6022 } from "../../typechain-types";

describe("When depositing collateral into reward pool lifetime vault", async function () {
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
        _rewardPoolLifetimeVault.connect(_otherAccount).deposit()
      ).to.be.revertedWithCustomError(
        _rewardPoolLifetimeVault,
        "CallerNotRewardPool"
      );
    });
  });

  describe("Given caller didn't approve protocol token", async function () {
    it("Should revert with 'ERC20InsufficientAllowance' error", async function () {
      await expect(
        _rewardPoolLifetimeVault.deposit()
      ).to.be.revertedWithCustomError(_token6022, "ERC20InsufficientAllowance");
    });
  });

  describe("Given caller approve protocol token", async function () {
    beforeEach(async function () {
      await _token6022.approve(
        await _rewardPoolLifetimeVault.getAddress(),
        lifetimeVaultAmount
      );
    });

    describe("Given already deposited collateral", async function () {
      beforeEach(async function () {
        await _rewardPoolLifetimeVault.deposit();
      });

      it("Should revert with 'AlreadyDeposited' error", async function () {
        await expect(
          _rewardPoolLifetimeVault.deposit()
        ).to.be.revertedWithCustomError(
          _rewardPoolLifetimeVault,
          "AlreadyDeposited"
        );
      });
    });

    describe("Given no collateral deposited yet", async function () {
      it("Should mark the vault as deposited", async function () {
        await _rewardPoolLifetimeVault.deposit();

        expect(await _rewardPoolLifetimeVault.isDeposited()).to.be.true;
      });

      it("Should store the expected amount", async function () {
        await _rewardPoolLifetimeVault.deposit();

        expect(
          await _token6022.balanceOf(
            await _rewardPoolLifetimeVault.getAddress()
          )
        ).to.equal(lifetimeVaultAmount);
      });

      it("Should take the collateral from the caller", async function () {
        const callerBalanceOfBefore = await _token6022.balanceOf(
          _owner.address
        );
        await _rewardPoolLifetimeVault.deposit();
        const callerBalanceOfAfter = await _token6022.balanceOf(_owner.address);

        const vaultBalanceOfAfter = await _token6022.balanceOf(
          await _rewardPoolLifetimeVault.getAddress()
        );

        expect(vaultBalanceOfAfter).to.be.equal(
          callerBalanceOfBefore - callerBalanceOfAfter
        );
      });

      it("Should emit 'Deposited' event", async function () {
        await expect(_rewardPoolLifetimeVault.deposit())
          .to.emit(_rewardPoolLifetimeVault, "Deposited")
          .withArgs(_owner, lifetimeVaultAmount);
      });
    });
  });
});
