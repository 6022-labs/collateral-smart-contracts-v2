import React from "react";
import { Address } from "viem";
import { useAccount, usePublicClient } from "wagmi";
import { getRewardPoolsByCreator } from "@/utils/controller6022";

type CreatedRewardPoolContextType = {
  hasCreatedRewardPool: boolean;
  createdRewardPoolAddress?: Address;
  refreshCreatedRewardPool: () => Promise<void>;
};

const CreatedRewardPoolContext = React.createContext<
  CreatedRewardPoolContextType | undefined
>(undefined);

type CreatedRewardPoolContextProviderProps = {
  children: React.ReactNode;
};

export function CreatedRewardPoolContextProvider(
  props: Readonly<CreatedRewardPoolContextProviderProps>
) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [hasCreatedRewardPool, setHasCreatedRewardPool] = React.useState(false);
  const [createdRewardPoolAddress, setCreatedRewardPoolAddress] =
    React.useState<Address | undefined>(undefined);

  const refreshCreatedRewardPool = async () => {
    if (!address) return;

    let rewardPoolAddress = await getRewardPoolsByCreator(
      publicClient,
      address
    );

    if (rewardPoolAddress.length > 0) {
      setHasCreatedRewardPool(true);
      setCreatedRewardPoolAddress(rewardPoolAddress[0]);
    } else {
      setHasCreatedRewardPool(false);
      setCreatedRewardPoolAddress(undefined);
    }
  };

  React.useEffect(() => {
    refreshCreatedRewardPool();
  }, [address]);

  return React.useMemo(() => {
    return (
      <CreatedRewardPoolContext.Provider
        value={{
          hasCreatedRewardPool,
          refreshCreatedRewardPool,
          createdRewardPoolAddress,
        }}
      >
        {props.children}
      </CreatedRewardPoolContext.Provider>
    );
  }, [hasCreatedRewardPool, createdRewardPoolAddress]);
}

export function useCreatedRewardPool() {
  const context = React.useContext(CreatedRewardPoolContext);
  if (context === undefined) {
    throw new Error(
      "useCreatedRewardPool must be used within a CreatedRewardPoolContextProvider"
    );
  }
  return context;
}
