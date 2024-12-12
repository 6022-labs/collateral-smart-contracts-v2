import { Address } from "viem";
import { UseWriteContractReturnType } from "wagmi";
import { abi } from "@/abis/RewardPoolLifetimeVault6022";

export function withdraw(
  client: UseWriteContractReturnType,
  lifetimeVaultAddress: Address
) {
  return client?.writeContractAsync({
    abi: abi,
    functionName: "withdraw",
    address: lifetimeVaultAddress,
  });
}
