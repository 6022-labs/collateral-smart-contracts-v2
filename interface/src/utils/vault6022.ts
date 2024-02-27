import { Address } from "viem";
import { abi } from "@/abis/Vault6022";
import { UsePublicClientReturnType, UseWriteContractReturnType } from "wagmi";

export async function vaultOverview(
  client: UsePublicClientReturnType,
  address: Address,
  userAddress: Address
) {
  let baseConfig = {
    abi: abi,
    address: address,
  };

  console.log("fetching vault overview with address", userAddress);

  let informationPromise = client?.readContract({
    ...baseConfig,
    functionName: "vaultOverview",
  });

  let ownedNFTsPromise = client?.readContract({
    ...baseConfig,
    functionName: "balanceOf",
    args: [userAddress],
  });

  let ownedNFTs = await ownedNFTsPromise;
  let information = (await informationPromise) as any;

  return {
    address,
    ownedNFTs,
    ...information,
  };
}

export async function ownerOf(
  client: UsePublicClientReturnType,
  address: Address,
  tokenId: number
) {
  return await client?.readContract({
    abi: abi,
    address: address,
    functionName: "ownerOf",
    args: [tokenId],
  });
}

export async function deposit(
  client: UseWriteContractReturnType,
  address: Address
) {
  return await client?.writeContractAsync({
    abi: abi,
    address: address,
    functionName: "deposit",
  });
}

export async function withdraw(
  client: UseWriteContractReturnType,
  address: Address
) {
  return await client?.writeContractAsync({
    abi: abi,
    address: address,
    functionName: "withdraw",
  });
}

export async function safeTransferFrom(
  client: UseWriteContractReturnType,
  address: Address,
  from: Address,
  to: Address,
  tokenId: bigint
) {
  return await client?.writeContractAsync({
    abi: abi,
    address: address,
    functionName: "safeTransferFrom",
    args: [from, to, tokenId],
  });
}
