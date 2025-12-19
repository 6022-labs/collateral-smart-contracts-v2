import { expect } from "chai";
import { ethers } from "hardhat";
import { parseVaultFromVaultCreatedLogs } from "../utils";
import { ERC721, MockERC20, Vault6022 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  time,
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";

describe("When depositing ERC721 collateral", function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  let _erc721: ERC721;
  let _vault6022: Vault6022;
  let _token6022: MockERC20;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token6022 = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000")
    );

    const Controller6022 = await ethers.getContractFactory("Controller6022");
    const controller6022 = await Controller6022.deploy();

    const RewardPool6022 = await ethers.getContractFactory("RewardPool6022");
    const rewardPool6022 = await RewardPool6022.deploy(
      await owner.getAddress(),
      await controller6022.getAddress(),
      await token6022.getAddress()
    );

    await controller6022.addFactory(await owner.getAddress());
    await controller6022.pushRewardPool(await rewardPool6022.getAddress());
    await controller6022.removeFactory(await owner.getAddress());

    // Approve a lot of tokens to pay fees
    await token6022.approve(
      await rewardPool6022.getAddress(),
      ethers.parseEther("100000")
    );

    await token6022.transfer(
      await rewardPool6022.getAddress(),
      ethers.parseEther("1")
    );
    await rewardPool6022.createLifetimeVault(ethers.parseEther("1"));
    await rewardPool6022.depositToLifetimeVault();

    // Create a vault (ERC721) to use it as collateral for another vault
    let tx = await rewardPool6022.createVault(
      "Vault6022",
      lockUntil,
      ethers.parseEther("10"),
      await token6022.getAddress(),
      BigInt(0), // ERC20
      ethers.parseEther("10")
    );
    let txReceipt = await tx.wait();
    const erc721 = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

    tx = await rewardPool6022.createVault(
      "Vault6022",
      lockUntil,
      1,
      await erc721.getAddress(),
      BigInt(1), // ERC721
      ethers.parseEther("10")
    );
    txReceipt = await tx.wait();
    const vault6022 = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      owner,
      erc721,
      vault6022,
      token6022,
      otherAccount,
    };
  }

  beforeEach(async function () {
    const { vault6022, erc721, token6022, owner, otherAccount } =
      await loadFixture(deployVault);

    _erc721 = erc721;
    _vault6022 = vault6022;
    _token6022 = token6022;

    _owner = owner;
    _otherAccount = otherAccount;
  });

  describe("Given caller don't have a key", async function () {
    it("Should revert with 'NotEnoughtNFTToDeposit' error", async function () {
      await expect(
        _vault6022.connect(_otherAccount).deposit()
      ).to.be.revertedWithCustomError(_vault6022, "NotEnoughNFTToDeposit");
    });
  });

  describe("Given caller own a key", async function () {
    beforeEach(async function () {
      _vault6022.approve(await _owner.getAddress(), 1);
      _vault6022.transferFrom(
        await _owner.getAddress(),
        await _otherAccount.getAddress(),
        1
      );

      _erc721.approve(await _owner.getAddress(), 1);
      _erc721.transferFrom(
        await _owner.getAddress(),
        await _otherAccount.getAddress(),
        1
      );

      await _erc721
        .connect(_otherAccount)
        .approve(
          await _vault6022.getAddress(),
          await _vault6022.wantedAmount()
        );
    });

    describe("But collateral is already deposited", async function () {
      beforeEach(async function () {
        await _vault6022.connect(_otherAccount).deposit();
      });

      it("Should revert with 'AlreadyDeposited' error", async function () {
        await expect(
          _vault6022.connect(_otherAccount).deposit()
        ).to.be.revertedWithCustomError(_vault6022, "AlreadyDeposited");
      });
    });

    describe("But lockedUntil is reached", async function () {
      beforeEach(async function () {
        await time.increase(lockIn);
      });

      it("Should revert with 'TooLateToDeposit' error", async function () {
        await expect(
          _vault6022.connect(_otherAccount).deposit()
        ).to.be.revertedWithCustomError(_vault6022, "TooLateToDeposit");
      });
    });

    describe("And lockedUntil is not reached and collateral is not deposited", async function () {
      it("Should emit 'Deposit' event", async function () {
        await expect(_vault6022.connect(_otherAccount).deposit()).to.emit(
          _vault6022,
          "Deposited"
        );
      });

      it("Should mark the vault as deposited", async function () {
        await _vault6022.connect(_otherAccount).deposit();

        expect(await _vault6022.isDeposited()).to.be.true;
      });

      it("Should fill the deposit timestamp", async function () {
        await _vault6022.connect(_otherAccount).deposit();

        expect(await _vault6022.depositTimestamp()).to.not.be.equal(BigInt(0));
      });

      it("Should mark the vault as rewardable", async function () {
        await _vault6022.connect(_otherAccount).deposit();

        expect(await _vault6022.isRewardable()).to.be.true;
      });

      it("Should take the collateral from the caller", async function () {
        const wantedAmount = await _vault6022.wantedAmount();

        expect(await _erc721.ownerOf(wantedAmount)).to.be.equal(
          _otherAccount.address
        );
        await _vault6022.connect(_otherAccount).deposit();
        expect(await _erc721.ownerOf(wantedAmount)).to.be.equal(
          await _vault6022.getAddress()
        );
      });
    });
  });
});
