import React from "react";
import { Address } from "viem";
import { usePublicClient } from "wagmi";
import { ownerOf } from "@/utils/vault6022";

type VaultDetailsContextType = {
  nftOwners: Address[];
  refreshNftOwners: () => Promise<void>;
};

const VaultDetailsContext = React.createContext<
  VaultDetailsContextType | undefined
>(undefined);

type VaultDetailsContextProviderProps = {
  vaultAddress: Address;
  children: React.ReactNode;
};

export function VaultDetailsContextProvider(
  props: Readonly<VaultDetailsContextProviderProps>
) {
  const publicClient = usePublicClient();
  const [nftOwners, setNftOwners] = React.useState<Address[]>([]);

  const refreshNftOwners = async () => {
    let ownerOfFirstPromise = ownerOf(publicClient, props.vaultAddress, 1);
    let ownerOfSecondPromise = ownerOf(publicClient, props.vaultAddress, 2);
    let ownerOfThirdPromise = ownerOf(publicClient, props.vaultAddress, 3);

    Promise.all([
      ownerOfFirstPromise,
      ownerOfSecondPromise,
      ownerOfThirdPromise,
    ]).then((values) => {
      setNftOwners(values.map((value) => value as Address));
    });
  };

  React.useEffect(() => {
    refreshNftOwners();
  }, []);

  return React.useMemo(() => {
    return (
      <VaultDetailsContext.Provider
        value={{
          nftOwners,
          refreshNftOwners,
        }}
      >
        {props.children}
      </VaultDetailsContext.Provider>
    );
  }, [nftOwners]);
}

export function useVaultDetails() {
  const context = React.useContext(VaultDetailsContext);
  if (context === undefined) {
    throw new Error(
      "useVaultDetails must be used within a VaultDetailsProvider"
    );
  }
  return context;
}
