import { EventLog, Log, LogDescription } from "ethers";
import { ethers } from "hardhat";
import { Vault6022 } from "../typechain-types";

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
