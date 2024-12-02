import { Address } from "viem";

export type Vault = {
  name: string;
  creator: string;
  address: Address;
  ownedNFTs: bigint;
  lockedUntil: bigint;
  storageType: bigint;
  wantedAmount: bigint;
  isWithdrawn: boolean;
  isDeposited: boolean;
  rewardWeight: bigint;
  depositTimestamp: bigint;
  collectedRewards: bigint;
  rewardPoolAddress: string;
  creationTimestamp: bigint;
  withdrawTimestamp: bigint;
  wantedTokenSymbol: string;
  wantedTokenAddress: Address;
  wantedTokenDecimals: number;
  balanceOfWantedToken: bigint;
  backedValueProtocolToken: bigint;
};
