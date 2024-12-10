import { ethers } from "hardhat";
import { EventLog, Log, LogDescription } from "ethers";
import {
  RewardPool6022,
  RewardPoolLifetimeVault6022,
  Token6022,
  Vault6022,
} from "../typechain-types";

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
    "RewardPool6022"
  );

  const vaultAddress = vaultCreatedLogs[0].args[0];
  const Vault6022 = await ethers.getContractFactory("Vault6022");
  return Vault6022.attach(vaultAddress) as Vault6022;
}

export async function parseRewardPoolFromRewardPoolCreatedLogs(
  logs: (EventLog | Log)[]
) {
  const rewardPoolCreatedLogs = await logsToLogDescriptions(
    logs,
    "RewardPoolCreated(address)",
    "RewardPoolFactory6022"
  );

  const rewardPoolAddress = rewardPoolCreatedLogs[0].args[0];
  const RewardPool6022 = await ethers.getContractFactory("RewardPool6022");
  return RewardPool6022.attach(rewardPoolAddress) as RewardPool6022;
}

export async function parseRewardPoolLifetimeVaultFromVaultCreatedLogs(
  logs: (EventLog | Log)[]
) {
  const vaultCreatedLogs = await logsToLogDescriptions(
    logs,
    "VaultCreated(address)",
    "RewardPool6022"
  );

  const lifetimeVaultAddress = vaultCreatedLogs[0].args[0];
  const RewardPoolLifetimeVault6022 = await ethers.getContractFactory(
    "RewardPoolLifetimeVault6022"
  );
  return RewardPoolLifetimeVault6022.attach(
    lifetimeVaultAddress
  ) as RewardPoolLifetimeVault6022;
}

export async function createDepositedVault(
  token6022: Token6022,
  rewardPool6022: RewardPool6022,
  lockedUntil: number,
  wantedAmountInTheVault: bigint
) {
  const tx = await rewardPool6022.createVault(
    "TestVault",
    lockedUntil,
    wantedAmountInTheVault,
    await token6022.getAddress(),
    BigInt(0),
    wantedAmountInTheVault
  );
  const txReceipt = await tx.wait();

  const vault = await parseVaultFromVaultCreatedLogs(txReceipt!.logs);
  await token6022.approve(await vault.getAddress(), await vault.wantedAmount());
  await vault.deposit();

  return vault;
}

export async function rewardPoolRemainingRewards(rewardPool: RewardPool6022) {
  let remainingRewards = BigInt(0);
  const allVaultsLength = await rewardPool.allVaultsLength();

  for (let index = 0; index < allVaultsLength; index++) {
    const vaultAddress = await rewardPool.allVaults(index);
    remainingRewards += await rewardPool.collectedRewards(vaultAddress);
  }

  return remainingRewards;
}

export async function getRewardableVaults(rewardPool: RewardPool6022) {
  let rewardableVaults = [];
  let index = 0;

  let currentVault: string;

  const Vault6022 = await ethers.getContractFactory("Vault6022");

  try {
    while ((currentVault = await rewardPool.allVaults(index))) {
      let vault = Vault6022.attach(currentVault) as Vault6022;

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
