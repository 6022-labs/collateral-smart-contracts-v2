import { Address } from "viem";
import { abi } from "@/abis/ERC721";
import { UsePublicClientReturnType, UseWriteContractReturnType } from "wagmi";

export async function approve(
  client: UseWriteContractReturnType,
  address: Address,
  spender: Address,
  amount: bigint
) {
  return await client?.writeContractAsync({
    abi: abi,
    address: address,
    functionName: "approve",
    args: [spender, amount],
  });
}

export async function getApproved(
  client: UsePublicClientReturnType,
  address: Address,
  tokenId: bigint
): Promise<Address> {
  return (await client?.readContract({
    abi: abi,
    address: address,
    functionName: "getApproved",
    args: [tokenId],
  })) as Address;
}
