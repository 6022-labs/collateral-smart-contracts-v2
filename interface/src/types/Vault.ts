import { Address } from "viem";

export type Vault = {
  name: string;
  address: Address;
  ownedNFTs: bigint;
  lockedUntil: bigint;
  wantedAmount: bigint;
  isWithdrawn: boolean;
  isDeposited: boolean;
  collectedFees: bigint;
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
