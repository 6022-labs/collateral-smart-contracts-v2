import { expect } from "chai";
import { ethers } from "hardhat";
import { loadFixture, reset } from "@nomicfoundation/hardhat-network-helpers";
import { RewardPoolLifetimeVault6022, Token6022 } from "../../typechain-types";

describe("When checking is rewardable for reward pool lifetime vault", async function () {
  const lifetimeVaultAmount = ethers.parseEther("1");

  let _token6022: Token6022;
  let _rewardPoolLifetimeVault: RewardPoolLifetimeVault6022;

  async function deployRewardPoolLifetimeVault() {
    await reset();

    const [owner] = await ethers.getSigners();

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
      token6022,
      rewardPoolLifetimeVault,
    };
  }

  beforeEach(async function () {
    const { token6022, rewardPoolLifetimeVault } = await loadFixture(
      deployRewardPoolLifetimeVault
    );

    _token6022 = token6022;
    _rewardPoolLifetimeVault = rewardPoolLifetimeVault;
  });

  describe("Given the collateral is not deposited", async function () {
    it("Should return false", async function () {
      expect(await _rewardPoolLifetimeVault.isRewardable()).to.be.false;
    });
  });

  describe("Given the collateral is withdrawn", async function () {
    beforeEach(async function () {
      await _token6022.approve(
        await _rewardPoolLifetimeVault.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPoolLifetimeVault.deposit();

      await _rewardPoolLifetimeVault.withdraw();
    });

    it("Should return false", async function () {
      expect(await _rewardPoolLifetimeVault.isRewardable()).to.be;
    });
  });

  describe("Given the collateral is deposited and not withdrawn", async function () {
    beforeEach(async function () {
      await _token6022.approve(
        await _rewardPoolLifetimeVault.getAddress(),
        lifetimeVaultAmount
      );
      await _rewardPoolLifetimeVault.deposit();
    });

    it("Should return true", async function () {
      expect(await _rewardPoolLifetimeVault.isRewardable()).to.be.true;
    });
  });
});
