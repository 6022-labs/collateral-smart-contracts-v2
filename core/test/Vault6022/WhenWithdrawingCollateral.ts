import { expect } from "chai";
import { ethers } from "hardhat";
import { EventLog } from "ethers";
import { RewardPool6022, Token6022, Vault6022 } from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time, reset } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When depositing collateral", function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  let _vault6022: Vault6022;
  let _token6022: Token6022;
  let _rewardPool6022: RewardPool6022;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const Token6022 = await ethers.getContractFactory("Token6022");
    const token6022 = await Token6022.deploy(
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

    await token6022.approve(
      await rewardPool6022.getAddress(),
      ethers.parseEther("100000")
    );

    const tx = await rewardPool6022.createVault(
      "Vault6022",
      lockUntil,
      ethers.parseEther("10"),
      await token6022.getAddress(),
      BigInt(0),
      ethers.parseEther("10")
    );

    const txReceipt = await tx.wait();

    const events = <EventLog[]>(
      txReceipt?.logs.filter((x) => x instanceof EventLog)
    );
    const vaultCreatedEvent = events.filter(
      (x) =>
        x.fragment.name === rewardPool6022.filters["VaultCreated(address)"].name
    )[0];

    const Vault6022 = await ethers.getContractFactory("Vault6022");
    const vault6022 = Vault6022.attach(vaultCreatedEvent.args[0]) as Vault6022;

    return {
      owner,
      vault6022,
      token6022,
      otherAccount,
      rewardPool6022,
    };
  }

  beforeEach(async function () {
    const { owner, vault6022, token6022, rewardPool6022, otherAccount } =
      await deployVault();

    _owner = owner;
    _vault6022 = vault6022;
    _token6022 = token6022;
    _otherAccount = otherAccount;
    _rewardPool6022 = rewardPool6022;
  });

  describe("Given vault does not have a deposit", async function () {
    it("Should revert with 'ContractNotDeposited' error", async function () {
      await expect(_vault6022.withdraw()).to.be.revertedWithCustomError(
        _vault6022,
        "ContractNotDeposited"
      );
    });
  });

  describe("Given vault have a deposit", async function () {
    beforeEach(async function () {
      await _token6022.approve(
        await _vault6022.getAddress(),
        await _vault6022.wantedAmount()
      );
      await _vault6022.deposit();
    });

    describe("And lockedUntil is not reached", async function () {
      describe("And caller hold 2 NFT", async function () {
        beforeEach(async function () {
          await _vault6022.approve(await _owner.getAddress(), 1);
          await _vault6022.approve(await _owner.getAddress(), 2);
          await _vault6022.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            1
          );
          await _vault6022.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            2
          );
        });

        it("Should emit 'Withdrawn' event", async function () {
          await expect(_vault6022.connect(_otherAccount).withdraw()).to.emit(
            _vault6022,
            "Withdrawn"
          );
        });

        it("Should emit 'Reinvested' event", async function () {
          await expect(_vault6022.connect(_otherAccount).withdraw()).to.emit(
            _rewardPool6022,
            "Reinvested"
          );
        });
      });

      describe("But caller only hold 1 NFT", async function () {
        beforeEach(async function () {
          await _vault6022.approve(await _owner.getAddress(), 1);
          await _vault6022.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            1
          );
        });

        it("Should revert with 'NotEnoughtNFTToWithdraw' error", async function () {
          await expect(
            _vault6022.connect(_otherAccount).withdraw()
          ).to.be.revertedWithCustomError(
            _vault6022,
            "NotEnoughtNFTToWithdraw"
          );
        });
      });

      describe("But caller don't have any NFT", async function () {
        it("Should revert with 'NotEnoughtNFTToWithdraw' error", async function () {
          await expect(
            _vault6022.connect(_otherAccount).withdraw()
          ).to.be.revertedWithCustomError(
            _vault6022,
            "NotEnoughtNFTToWithdraw"
          );
        });
      });
    });

    describe("And lockedUntil is reached", async function () {
      beforeEach(async function () {
        await time.increase(lockIn);
      });

      describe("And caller hold 2 NFT", async function () {
        beforeEach(async function () {
          await _vault6022.approve(await _owner.getAddress(), 1);
          await _vault6022.approve(await _owner.getAddress(), 2);
          await _vault6022.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            1
          );
          await _vault6022.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            2
          );
        });

        it("Should emit 'Withdrawn' event", async function () {
          await expect(_vault6022.connect(_otherAccount).withdraw()).to.emit(
            _vault6022,
            "Withdrawn"
          );
        });

        it("Should emit 'Harvested' event", async function () {
          await expect(_vault6022.connect(_otherAccount).withdraw()).to.emit(
            _rewardPool6022,
            "Harvested"
          );
        });
      });

      describe("And caller hold 1 NFT", async function () {
        beforeEach(async function () {
          await _vault6022.approve(await _owner.getAddress(), 1);
          await _vault6022.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            1
          );
        });

        it("Should emit 'Withdrawn' event", async function () {
          await expect(_vault6022.connect(_otherAccount).withdraw()).to.emit(
            _vault6022,
            "Withdrawn"
          );
        });

        it("Should emit 'Harvested' event", async function () {
          await expect(_vault6022.connect(_otherAccount).withdraw()).to.emit(
            _rewardPool6022,
            "Harvested"
          );
        });
      });

      describe("But caller don't have any NFT", async function () {
        it("Should revert with 'NotEnoughtNFTToWithdraw' error", async function () {
          await expect(
            _vault6022.connect(_otherAccount).withdraw()
          ).to.be.revertedWithCustomError(
            _vault6022,
            "NotEnoughtNFTToWithdraw"
          );
        });
      });
    });
  });
});
