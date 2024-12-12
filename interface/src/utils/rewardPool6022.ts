import { Address } from "viem";
import { abi } from "@/abis/RewardPool6022";
import { UsePublicClientReturnType, UseWriteContractReturnType } from "wagmi";

export async function createVault(
  client: UseWriteContractReturnType,
  rewardPoolAddress: Address,
  name: string,
  lockedUntil: number,
  wantedAmount: bigint,
  wantedTokenAddress: string,
  storageType: bigint,
  backedValueProtocolToken: bigint
) {
  return await client?.writeContractAsync({
    abi: abi,
    address: rewardPoolAddress,
    functionName: "createVault",
    args: [
      name,
      lockedUntil,
      wantedAmount,
      wantedTokenAddress,
      storageType,
      backedValueProtocolToken,
    ],
  });
}

export async function getLifetimeVault(
  client: UsePublicClientReturnType,
  rewardPoolAddress: Address
): Promise<Address> {
  return (await client?.readContract({
    abi: abi,
    address: rewardPoolAddress,
    functionName: "lifetimeVault",
  })) as Address;
}
