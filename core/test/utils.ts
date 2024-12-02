import { EventLog, Log, LogDescription } from "ethers";
import { ethers } from "hardhat";

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
