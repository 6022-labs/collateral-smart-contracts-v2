import { expect } from "chai";
import { ethers } from "hardhat";
import { parseVaultFromVaultCreatedLogs } from "../utils";
import {
  CollateralRewardPool,
  MockERC20,
  CollateralVault,
} from "../../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import { time, reset } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("When withdrawing ERC20 collateral", function () {
  const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  let _vault: CollateralVault;
  let _token: MockERC20;
  let _rewardPool: CollateralRewardPool;

  let _owner: HardhatEthersSigner;
  let _otherAccount: HardhatEthersSigner;

  async function deployVault() {
    await reset();

    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const MockERC20 = await ethers.getContractFactory("MockERC20");
    const token = await MockERC20.deploy(
      await owner.getAddress(),
      ethers.parseEther("100000"),
    );

    const CollateralController = await ethers.getContractFactory(
      "CollateralController",
    );
    const controller = await CollateralController.deploy();

    const CollateralRewardPool = await ethers.getContractFactory(
      "CollateralRewardPool",
    );
    const rewardPool = await CollateralRewardPool.deploy(
      await owner.getAddress(),
      await controller.getAddress(),
      await token.getAddress(),
    );

    await controller.addFactory(await owner.getAddress());
    await controller.pushRewardPool(await rewardPool.getAddress());
    await controller.removeFactory(await owner.getAddress());

    // Approve a lot of tokens to pay fees
    await token.approve(
      await rewardPool.getAddress(),
      ethers.parseEther("100000"),
    );

    await token.transfer(await rewardPool.getAddress(), ethers.parseEther("1"));
    await rewardPool.createLifetimeVault(ethers.parseEther("1"));
    await rewardPool.depositToLifetimeVault();

    // Use the token as collateral to simplify tests as it is a ERC20
    const tx = await rewardPool.createVault(
      "CollateralVault",
      "vault-image.png",
      lockUntil,
      ethers.parseEther("10"),
      await token.getAddress(),
      BigInt(0),
      // ERC20
      ethers.parseEther("10"),
    );
    const txReceipt = await tx.wait();

    const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

    return {
      owner,
      vault,
      token,
      otherAccount,
      rewardPool,
    };
  }

  beforeEach(async function () {
    const { owner, vault, token, rewardPool, otherAccount } =
      await deployVault();

    _owner = owner;
    _vault = vault;
    _token = token;
    _otherAccount = otherAccount;
    _rewardPool = rewardPool;
  });

  describe("Given collateral is not deposited", async function () {
    it("Should revert with 'NotDeposited' error", async function () {
      await expect(_vault.withdraw()).to.be.revertedWithCustomError(
        _vault,
        "NotDeposited",
      );
    });
  });

  describe("Given collateral is deposited", async function () {
    beforeEach(async function () {
      await _token.approve(
        await _vault.getAddress(),
        await _vault.wantedAmount(),
      );
      await _vault.deposit();
    });

    describe("But collateral is already withdrawn", async function () {
      beforeEach(async function () {
        await _vault.withdraw();
      });

      it("Should revert with 'AlreadyWithdrawn' error", async function () {
        await expect(_vault.withdraw()).to.be.revertedWithCustomError(
          _vault,
          "AlreadyWithdrawn",
        );
      });
    });

    describe("And lockedUntil is not reached", async function () {
      describe("And caller hold 2 NFT", async function () {
        beforeEach(async function () {
          await _vault.approve(await _owner.getAddress(), 1);
          await _vault.approve(await _owner.getAddress(), 2);
          await _vault.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            1,
          );
          await _vault.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            2,
          );
        });

        it("Should emit 'Withdrawn' event", async function () {
          await expect(_vault.connect(_otherAccount).withdraw()).to.emit(
            _vault,
            "Withdrawn",
          );
        });

        it("Should emit 'Reinvested' event", async function () {
          await expect(_vault.connect(_otherAccount).withdraw()).to.emit(
            _rewardPool,
            "Reinvested",
          );
        });

        it("Should mark the vault as withdrawn", async function () {
          await _vault.connect(_otherAccount).withdraw();

          expect(await _vault.isWithdrawn()).to.be.true;
        });

        it("Should mark the vault as not rewardable", async function () {
          await _vault.connect(_otherAccount).withdraw();

          expect(await _vault.isRewardable()).to.be.false;
        });

        it("Should be no more collateral in the vault", async function () {
          await _vault.connect(_otherAccount).withdraw();

          expect(await _token.balanceOf(await _vault.getAddress())).to.be.equal(
            0,
          );
        });

        it("Should withdraw the collateral to the caller", async function () {
          const vaultBalanceOfBefore = await _token.balanceOf(
            await _vault.getAddress(),
          );
          const callerBalanceBefore = await _token.balanceOf(
            _otherAccount.address,
          );
          await _vault.connect(_otherAccount).withdraw();
          const callerBalanceAfter = await _token.balanceOf(
            _otherAccount.address,
          );

          expect(callerBalanceAfter).to.be.equal(
            callerBalanceBefore + vaultBalanceOfBefore,
          );
        });
      });

      describe("But caller only hold 1 NFT", async function () {
        beforeEach(async function () {
          await _vault.approve(await _owner.getAddress(), 1);
          await _vault.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            1,
          );
        });

        it("Should revert with 'NotEnoughtNFTToWithdraw' error", async function () {
          await expect(
            _vault.connect(_otherAccount).withdraw(),
          ).to.be.revertedWithCustomError(_vault, "NotEnoughNFTToWithdraw");
        });
      });

      describe("But caller don't have any NFT", async function () {
        it("Should revert with 'NotEnoughtNFTToWithdraw' error", async function () {
          await expect(
            _vault.connect(_otherAccount).withdraw(),
          ).to.be.revertedWithCustomError(_vault, "NotEnoughNFTToWithdraw");
        });
      });
    });

    describe("And lockedUntil is reached", async function () {
      beforeEach(async function () {
        await time.increase(lockIn);
      });

      describe("And caller hold 2 NFT", async function () {
        beforeEach(async function () {
          await _vault.approve(await _owner.getAddress(), 1);
          await _vault.approve(await _owner.getAddress(), 2);
          await _vault.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            1,
          );
          await _vault.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            2,
          );
        });

        it("Should emit 'Withdrawn' event", async function () {
          await expect(_vault.connect(_otherAccount).withdraw()).to.emit(
            _vault,
            "Withdrawn",
          );
        });

        it("Should emit 'Harvested' event", async function () {
          await expect(_vault.connect(_otherAccount).withdraw()).to.emit(
            _rewardPool,
            "Harvested",
          );
        });

        it("Should mark the vault as withdrawn", async function () {
          await _vault.connect(_otherAccount).withdraw();

          expect(await _vault.isWithdrawn()).to.be.true;
        });

        it("Should mark the vault as not rewardable", async function () {
          await _vault.connect(_otherAccount).withdraw();

          expect(await _vault.isRewardable()).to.be.false;
        });

        it("Should be no more collateral in the vault", async function () {
          await _vault.connect(_otherAccount).withdraw();

          expect(await _token.balanceOf(await _vault.getAddress())).to.be.equal(
            0,
          );
        });

        it("Should withdraw the collateral to the caller", async function () {
          const vaultBalanceOfBefore = await _token.balanceOf(
            await _vault.getAddress(),
          );
          const callerBalanceBefore = await _token.balanceOf(
            _otherAccount.address,
          );
          await _vault.connect(_otherAccount).withdraw();
          const callerBalanceAfter = await _token.balanceOf(
            _otherAccount.address,
          );

          expect(callerBalanceAfter).to.be.equal(
            callerBalanceBefore + vaultBalanceOfBefore,
          );
        });
      });

      describe("And caller hold 1 NFT", async function () {
        beforeEach(async function () {
          await _vault.approve(await _owner.getAddress(), 1);
          await _vault.transferFrom(
            await _owner.getAddress(),
            await _otherAccount.getAddress(),
            1,
          );
        });

        it("Should emit 'Withdrawn' event", async function () {
          await expect(_vault.connect(_otherAccount).withdraw()).to.emit(
            _vault,
            "Withdrawn",
          );
        });

        it("Should emit 'Harvested' event", async function () {
          await expect(_vault.connect(_otherAccount).withdraw()).to.emit(
            _rewardPool,
            "Harvested",
          );
        });

        it("Should mark the vault as withdrawn", async function () {
          await _vault.connect(_otherAccount).withdraw();

          expect(await _vault.isWithdrawn()).to.be.true;
        });

        it("Should mark the vault as not rewardable", async function () {
          await _vault.connect(_otherAccount).withdraw();

          expect(await _vault.isRewardable()).to.be.false;
        });

        it("Should be no more collateral in the vault", async function () {
          await _vault.connect(_otherAccount).withdraw();

          expect(await _token.balanceOf(await _vault.getAddress())).to.be.equal(
            0,
          );
        });

        it("Should withdraw the collateral to the caller", async function () {
          const vaultBalanceOfBefore = await _token.balanceOf(
            await _vault.getAddress(),
          );
          const callerBalanceBefore = await _token.balanceOf(
            _otherAccount.address,
          );
          await _vault.connect(_otherAccount).withdraw();
          const callerBalanceAfter = await _token.balanceOf(
            _otherAccount.address,
          );

          expect(callerBalanceAfter).to.be.equal(
            callerBalanceBefore + vaultBalanceOfBefore,
          );
        });
      });

      describe("But caller don't have any NFT", async function () {
        it("Should revert with 'NotEnoughtNFTToWithdraw' error", async function () {
          await expect(
            _vault.connect(_otherAccount).withdraw(),
          ).to.be.revertedWithCustomError(_vault, "NotEnoughNFTToWithdraw");
        });
      });
    });
  });
});
