import { Address } from "viem";
import { abi } from "@/abis/Controller6022";
import { UsePublicClientReturnType } from "wagmi";

export async function getVaultsByOwner(
  client: UsePublicClientReturnType,
  address: string
): Promise<string[]> {
  return (await client?.readContract({
    abi: abi,
    args: [address],
    functionName: "getVaultsByOwner",
    address: import.meta.env.VITE_CONTROLLER_SMART_CONTRACT_ADDRESS,
  })) as string[];
}

export async function getRewardPoolsByCreator(
  client: UsePublicClientReturnType,
  address: Address
): Promise<Address[]> {
  return (await client?.readContract({
    abi: abi,
    args: [address],
    functionName: "getRewardPoolsByCreator",
    address: import.meta.env.VITE_CONTROLLER_SMART_CONTRACT_ADDRESS,
  })) as Address[];
}
