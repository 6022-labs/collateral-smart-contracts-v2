import { Address } from "viem";
import { abi } from "@/abis/ERC20";
import { UsePublicClientReturnType, UseWriteContractReturnType } from "wagmi";

export async function getDecimals(
  client: UsePublicClientReturnType,
  address: Address
): Promise<number> {
  return (await client?.readContract({
    abi: abi,
    address: address,
    functionName: "decimals",
  })) as number;
}

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

export async function allowance(
  client: UsePublicClientReturnType,
  address: Address,
  owner: Address,
  spender: Address
): Promise<bigint> {
  return (await client?.readContract({
    abi: abi,
    address: address,
    functionName: "allowance",
    args: [owner, spender],
  })) as bigint;
}
