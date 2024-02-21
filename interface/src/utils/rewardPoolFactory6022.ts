import { abi } from "@/abis/RewardPoolFactory6022";
import { UseWriteContractReturnType } from "wagmi";

export function createRewardPool(client: UseWriteContractReturnType) {
  return client?.writeContractAsync({
    abi: abi,
    functionName: "createRewardPool",
    address: import.meta.env.VITE_REWARD_POOL_FACTORY_SMART_CONTRACT_ADDRESS,
  });
}
