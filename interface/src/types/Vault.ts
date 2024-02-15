export type Vault = {
  address: string;
  rewardPool: string;
  lockedUntil: bigint;
  wantedToken: string;
  isDeposited: boolean;
  isWithdrawn: boolean;
  wantedAmount: bigint;
  depositTimestamp: bigint;
  withdrawTimestamp: bigint;
};
