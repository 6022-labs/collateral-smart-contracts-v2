import { Address } from "viem";
import { abi } from "@/abis/Vault6022";
import { UsePublicClientReturnType } from "wagmi";

export async function fetchVaultData(
  client: UsePublicClientReturnType,
  address: Address,
  userAddress: Address
) {
  let baseConfig = {
    abi: abi,
    address: address,
  };

  let namePromise = client?.readContract({
    ...baseConfig,
    functionName: "name",
  });

  let ownedNFTsPromise = client?.readContract({
    ...baseConfig,
    functionName: "balanceOf",
    args: [userAddress],
  });

  let isDepositedPromise = client?.readContract({
    ...baseConfig,
    functionName: "isDeposited",
  });

  let isWithdrawnPromise = client?.readContract({
    ...baseConfig,
    functionName: "isWithdrawn",
  });

  let lockedUntilPromise = client?.readContract({
    ...baseConfig,
    functionName: "lockedUntil",
  });

  let wantedTokenPromise = client?.readContract({
    ...baseConfig,
    functionName: "wantedToken",
  });

  let wantedAmountPromise = client?.readContract({
    ...baseConfig,
    functionName: "wantedAmount",
  });

  let depositTimestampPromise = client?.readContract({
    ...baseConfig,
    functionName: "depositTimestamp",
  });

  let name = await namePromise;
  let ownedNFTs = await ownedNFTsPromise;
  let wantedToken = await wantedTokenPromise;
  let isDeposited = await isDepositedPromise;
  let isWithdrawn = await isWithdrawnPromise;
  let lockedUntil = await lockedUntilPromise;
  let wantedAmount = await wantedAmountPromise;
  let depositTimestamp = await depositTimestampPromise;

  return {
    name,
    ownedNFTs,
    wantedToken,
    isDeposited,
    isWithdrawn,
    lockedUntil,
    wantedAmount,
    depositTimestamp,
  };
}
