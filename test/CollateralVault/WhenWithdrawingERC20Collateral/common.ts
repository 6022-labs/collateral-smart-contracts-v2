import { ethers } from "hardhat";
import { parseVaultFromVaultCreatedLogs } from "../../utils";
import { reset } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";
import {
  MockERC20,
  CollateralVault,
  CollateralRewardPool,
} from "../../../typechain-types";

export const lockIn = 60 * 60 * 24 * 30 * 6; // 6 months
export const FEES_PERCENT_PRECISION = BigInt(100_000);
export const defaultWithdrawEarlyFeePercent = BigInt(2_000); // 2.000%
export const defaultWithdrawLateFeePercent = BigInt(3_000); // 3.000%

export type ERC20WithdrawTestSuite = {
  owner: HardhatEthersSigner;
  otherAccount: HardhatEthersSigner;
  beneficiary: HardhatEthersSigner;

  token: MockERC20;
  vault: CollateralVault;
  rewardPool: CollateralRewardPool;
};

export function computeFeesFromPercent(amount: bigint, feePercent: bigint) {
  return (amount * feePercent) / FEES_PERCENT_PRECISION;
}

export async function deployVaultWithFees(
  depositFeePercent: bigint,
  withdrawEarlyFeePercentForVault: bigint,
  withdrawLateFeePercentForVault: bigint,
): Promise<ERC20WithdrawTestSuite> {
  await reset();

  // Contracts are deployed using the first signer/account by default
  const [owner, otherAccount, beneficiary] = await ethers.getSigners();

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

  const lockUntil = Math.floor(Date.now() / 1000) + lockIn;

  // Use the token as collateral to simplify tests as it is a ERC20
  const tx = await rewardPool.createVaultWithFees(
    "CollateralVault",
    "vault-image.png",
    lockUntil,
    ethers.parseEther("10"),
    await token.getAddress(),
    BigInt(0),
    // ERC20
    ethers.parseEther("10"),
    depositFeePercent,
    withdrawEarlyFeePercentForVault,
    withdrawLateFeePercentForVault,
    await beneficiary.getAddress(),
  );
  const txReceipt = await tx.wait();

  const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);

  return {
    owner,
    otherAccount,
    beneficiary,
    token,
    vault,
    rewardPool,
  };
}

export async function deployDefaultVault(): Promise<ERC20WithdrawTestSuite> {
  return deployVaultWithFees(
    BigInt(0),
    defaultWithdrawEarlyFeePercent,
    defaultWithdrawLateFeePercent,
  );
}

export async function depositCollateral(ctx: ERC20WithdrawTestSuite) {
  await ctx.token.approve(
    await ctx.vault.getAddress(),
    await ctx.vault.wantedAmount(),
  );
  await ctx.vault.deposit();
}

export async function giveNFTsToOtherAccount(
  ctx: ERC20WithdrawTestSuite,
  tokenIds: number[],
) {
  for (const tokenId of tokenIds) {
    await ctx.vault.approve(await ctx.owner.getAddress(), tokenId);
    await ctx.vault.transferFrom(
      await ctx.owner.getAddress(),
      await ctx.otherAccount.getAddress(),
      tokenId,
    );
  }
}
