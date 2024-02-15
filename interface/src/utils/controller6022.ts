import { abi } from "@/abis/Controller6022";
import { UsePublicClientReturnType } from "wagmi";

export async function fetchOwnedVaults(
  client: UsePublicClientReturnType,
  address: string
): Promise<string[]> {
  return (await client?.readContract({
    address: import.meta.env.VITE_CONTROLLER_SMART_CONTRACT_ADDRESS,
    abi: abi,
    functionName: "getVaultsByOwner",
    args: [address],
  })) as string[];
}
