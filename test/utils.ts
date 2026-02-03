import { ethers } from "hardhat";
import { EventLog, Log, LogDescription } from "ethers";
import {
  CollateralRewardPool,
  CollateralRewardPoolLifetimeVault,
  MockERC20,
  CollateralVault,
} from "../typechain-types";

const PROTOCOL_FEES = BigInt(2);

export function computeFeesFromCollateral(amount: bigint) {
  return (amount * PROTOCOL_FEES) / BigInt(100);
}

export function computeFeesFromCollateralWithFees(amount: bigint) {
  const amountBy100 = amount * BigInt(100);
  const feesBy100 =
    (amountBy100 * PROTOCOL_FEES) / (BigInt(100) + PROTOCOL_FEES);

  return feesBy100 / BigInt(100);
}

export function findEventFromLogs(logs: (EventLog | Log)[], eventKey: string) {
  const vaultCreatedHash = ethers.keccak256(ethers.toUtf8Bytes(eventKey));

  return logs.filter((log) => log.topics[0] == vaultCreatedHash);
}

export async function logsToLogDescriptions(
  logs: (EventLog | Log)[],
  eventKey: string,
  contract: string
): Promise<LogDescription[]> {
  const wantedEvents = findEventFromLogs(logs, eventKey);

  const ContractFactory = await ethers.getContractFactory(contract);

  const logDescriptions = wantedEvents.map((log) => {
    return ContractFactory.interface.parseLog(log);
  });

  return logDescriptions.filter((x) => x !== null);
}

export async function parseVaultFromVaultCreatedLogs(logs: (EventLog | Log)[]) {
  const vaultCreatedLogs = await logsToLogDescriptions(
    logs,
    "VaultCreated(address)",
    "CollateralRewardPool"
  );

  const vaultAddress = vaultCreatedLogs[0].args[0];
  const CollateralVault = await ethers.getContractFactory("CollateralVault");
  return CollateralVault.attach(vaultAddress) as CollateralVault;
}

export async function parseRewardPoolFromRewardPoolCreatedLogs(
  logs: (EventLog | Log)[]
) {
  const rewardPoolCreatedLogs = await logsToLogDescriptions(
    logs,
    "RewardPoolCreated(address)",
    "CollateralRewardPoolFactory"
  );

  const rewardPoolAddress = rewardPoolCreatedLogs[0].args[0];
  const CollateralRewardPool = await ethers.getContractFactory("CollateralRewardPool");
  return CollateralRewardPool.attach(rewardPoolAddress) as CollateralRewardPool;
}

export async function parseRewardPoolLifetimeVaultFromVaultCreatedLogs(
  logs: (EventLog | Log)[]
) {
  const vaultCreatedLogs = await logsToLogDescriptions(
    logs,
    "VaultCreated(address)",
    "CollateralRewardPool"
  );

  const lifetimeVaultAddress = vaultCreatedLogs[0].args[0];
  const CollateralRewardPoolLifetimeVault = await ethers.getContractFactory(
    "CollateralRewardPoolLifetimeVault"
  );
  return CollateralRewardPoolLifetimeVault.attach(
    lifetimeVaultAddress
  ) as CollateralRewardPoolLifetimeVault;
}

export async function createDepositedVault(
  token: MockERC20,
  rewardPool: CollateralRewardPool,
  lockedUntil: number,
  wantedAmountInTheVault: bigint
) {
  // Just approve a lot of tokens to pay vault creation fees
  await token.approve(
    await rewardPool.getAddress(),
    wantedAmountInTheVault
  );

  const tx = await rewardPool.createVault(
    "TestVault",
    lockedUntil,
    wantedAmountInTheVault,
    await token.getAddress(),
    BigInt(0),
    wantedAmountInTheVault
  );
  const txReceipt = await tx.wait();

  const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);
  await token.approve(await vault.getAddress(), await vault.wantedAmount());
  await vault.deposit();

  return vault;
}

export async function rewardPoolTotalCollectedRewards(
  rewardPool: CollateralRewardPool
) {
  let totalCollectedRewards = BigInt(0);
  const allVaultsLength = await rewardPool.allVaultsLength();

  for (let index = 0; index < allVaultsLength; index++) {
    const vaultAddress = await rewardPool.allVaults(index);
    totalCollectedRewards += await rewardPool.collectedRewards(vaultAddress);
  }

  return totalCollectedRewards;
}

export async function getRewardableVaults(rewardPool: CollateralRewardPool) {
  let rewardableVaults = [];
  let index = 0;

  let currentVault: string;

  const CollateralVault = await ethers.getContractFactory("CollateralVault");

  try {
    while ((currentVault = await rewardPool.allVaults(index))) {
      let vault = CollateralVault.attach(currentVault) as CollateralVault;

      if (await vault.isRewardable()) {
        rewardableVaults.push(currentVault);
      }
      index++;
    }
  } catch (e) {
    // Do nothing
  }

  return rewardableVaults;
}

export function decodeTokenURI(tokenURI: string) {
  const decoded = Buffer.from(
    tokenURI.replace("data:application/json;base64,", ""),
    "base64"
  ).toString("utf-8");

  return JSON.parse(decoded);
}
