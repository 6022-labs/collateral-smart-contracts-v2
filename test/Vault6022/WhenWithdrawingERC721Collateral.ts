import { expect } from "chai";
import { ethers } from "hardhat";
import { parseVaultFromVaultCreatedLogs } from "../utils";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  time,
  reset,
  loadFixture,
} from "@nomicfoundation/hardhat-network-helpers";
import {
  ERC721,
  MockERC20,
  Vault6022,
  RewardPool6022,
} from "../../typechain-types";

describe("When withdrawing ERC721 collateral", async function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  let _erc721: ERC721;
  let _vault6022: Vault6022;
  let _token6022: MockERC20;
  let _rewardPool6022: RewardPool6022;

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
      rewardPool6022,
    };
  }

  beforeEach(async function () {
    const {
      owner,
      erc721,
      token6022,
      vault6022,
      otherAccount,
      rewardPool6022,
    } = await loadFixture(deployVault);

    _owner = owner;
    _erc721 = erc721;
    _vault6022 = vault6022;
    _token6022 = token6022;
    _otherAccount = otherAccount;
    _rewardPool6022 = rewardPool6022;
  });

  describe("Given collateral is not deposited", async function () {
    it("Should revert with 'NotDeposited' error", async function () {
      await expect(_vault6022.withdraw()).to.be.revertedWithCustomError(
        _vault6022,
        "NotDeposited"
      );
    });
  });

  describe("Given collateral is deposited", async function () {
    beforeEach(async function () {
      await _erc721.approve(
        await _vault6022.getAddress(),
        await _vault6022.wantedAmount()
      );
      await _vault6022.deposit();
    });

    describe("But collateral is already withdrawn", async function () {
      beforeEach(async function () {
        await _vault6022.withdraw();
      });

      it("Should revert with 'AlreadyWithdrawn' error", async function () {
        await expect(_vault6022.withdraw()).to.be.revertedWithCustomError(
          _vault6022,
          "AlreadyWithdrawn"
        );
      });
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

        it("Should mark the vault as withdrawn", async function () {
          await _vault6022.connect(_otherAccount).withdraw();

          expect(await _vault6022.isWithdrawn()).to.be.true;
        });

        it("Should mark the vault as not rewardable", async function () {
          await _vault6022.connect(_otherAccount).withdraw();

          expect(await _vault6022.isRewardable()).to.be.false;
        });

        it("Should be no more collateral in the vault", async function () {
          await _vault6022.connect(_otherAccount).withdraw();

          expect(
            await _erc721.ownerOf(await _vault6022.wantedAmount())
          ).to.not.be.equal(await _vault6022.getAddress());
        });

        it("Should withdraw the collateral to the caller", async function () {
          expect(
            await _erc721.ownerOf(await _vault6022.wantedAmount())
          ).to.be.equal(await _vault6022.getAddress());

          await _vault6022.connect(_otherAccount).withdraw();

          expect(
            await _erc721.ownerOf(await _vault6022.wantedAmount())
          ).to.be.equal(_otherAccount.address);
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
          ).to.be.revertedWithCustomError(_vault6022, "NotEnoughNFTToWithdraw");
        });
      });

      describe("But caller don't have any NFT", async function () {
        it("Should revert with 'NotEnoughtNFTToWithdraw' error", async function () {
          await expect(
            _vault6022.connect(_otherAccount).withdraw()
          ).to.be.revertedWithCustomError(_vault6022, "NotEnoughNFTToWithdraw");
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

        it("Should mark the vault as withdrawn", async function () {
          await _vault6022.connect(_otherAccount).withdraw();

          expect(await _vault6022.isWithdrawn()).to.be.true;
        });

        it("Should mark the vault as not rewardable", async function () {
          await _vault6022.connect(_otherAccount).withdraw();

          expect(await _vault6022.isRewardable()).to.be.false;
        });

        it("Should be no more collateral in the vault", async function () {
          await _vault6022.connect(_otherAccount).withdraw();

          expect(
            await _erc721.ownerOf(await _vault6022.wantedAmount())
          ).to.not.be.equal(await _vault6022.getAddress());
        });

        it("Should withdraw the collateral to the caller", async function () {
          expect(
            await _erc721.ownerOf(await _vault6022.wantedAmount())
          ).to.be.equal(await _vault6022.getAddress());

          await _vault6022.connect(_otherAccount).withdraw();

          expect(
            await _erc721.ownerOf(await _vault6022.wantedAmount())
          ).to.be.equal(_otherAccount.address);
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

        it("Should mark the vault as withdrawn", async function () {
          await _vault6022.connect(_otherAccount).withdraw();

          expect(await _vault6022.isWithdrawn()).to.be.true;
        });

        it("Should mark the vault as not rewardable", async function () {
          await _vault6022.connect(_otherAccount).withdraw();

          expect(await _vault6022.isRewardable()).to.be.false;
        });

        it("Should be no more collateral in the vault", async function () {
          await _vault6022.connect(_otherAccount).withdraw();

          expect(
            await _erc721.ownerOf(await _vault6022.wantedAmount())
          ).to.not.be.equal(await _vault6022.getAddress());
        });

        it("Should withdraw the collateral to the caller", async function () {
          expect(
            await _erc721.ownerOf(await _vault6022.wantedAmount())
          ).to.be.equal(await _vault6022.getAddress());

          await _vault6022.connect(_otherAccount).withdraw();

          expect(
            await _erc721.ownerOf(await _vault6022.wantedAmount())
          ).to.be.equal(_otherAccount.address);
        });
      });

      describe("But caller don't have any NFT", async function () {
        it("Should revert with 'NotEnoughtNFTToWithdraw' error", async function () {
          await expect(
            _vault6022.connect(_otherAccount).withdraw()
          ).to.be.revertedWithCustomError(_vault6022, "NotEnoughNFTToWithdraw");
        });
      });
    });
  });
});
