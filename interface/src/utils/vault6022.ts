import { Address } from "viem";
import { abi } from "@/abis/Vault6022";
import { UsePublicClientReturnType } from "wagmi";

export async function vaultOverview(
  client: UsePublicClientReturnType,
  address: Address,
  userAddress: Address
) {
  let baseConfig = {
    abi: abi,
    address: address,
  };

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
