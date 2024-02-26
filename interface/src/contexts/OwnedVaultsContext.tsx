import React from "react";
import { Vault } from "@/types/Vault";
import { useAccount, usePublicClient } from "wagmi";
import { getVaultsByOwner } from "@/utils/controller6022";
import { vaultOverview } from "@/utils/vault6022";

type OwnedVaultsContextType = {
  ownedVaults: Vault[];
  refreshOwnedVaults: () => Promise<void>;
  refreshSpecificVault: (vaultAddress: string) => Promise<void>;
};

const OwnedVaultsContext = React.createContext<
  OwnedVaultsContextType | undefined
>(undefined);

type OwnedVaultsContextProviderProps = {
  children: React.ReactNode;
};

export function OwnedVaultsContextProvider(
  props: Readonly<OwnedVaultsContextProviderProps>
) {
  const { address } = useAccount();
  const publicClient = usePublicClient();

  const [ownedVaults, setOwnedVaults] = React.useState<Vault[]>([]);

  const addOrReplaceVaults = (vaults: Vault[]) => {
    setOwnedVaults((oldVaults) => {
      let newVaults = oldVaults.filter(
        (oldVault) =>
          !vaults.find((vault) => vault.address === oldVault.address)
      );
      return [...newVaults, ...vaults];
    });
  };

  const refreshOwnedVaults = async () => {
    if (!address) return;
    let ownedVaultsAddress = await getVaultsByOwner(publicClient, address);

    let allPromises = [];

    for (let vaultAddress of ownedVaultsAddress) {
      let foundedVault = ownedVaults.find(
        (vault) => vault.address === vaultAddress
      );

      if (!foundedVault) {
        let typedVaultAddress = vaultAddress as `0x${string}`;

        allPromises.push(
          vaultOverview(publicClient, typedVaultAddress, address).catch((e) =>
            console.error(e)
          )
        );
      }
    }

    let data = await Promise.all(allPromises);
    addOrReplaceVaults(data);
  };

  const refreshSpecificVault = async (vaultAddress: string) => {
    if (!address) return;
    let foundedVault = ownedVaults.find(
      (vault) => vault.address === vaultAddress
    );

    if (foundedVault) {
      let typedVaultAddress = vaultAddress as `0x${string}`;

      let data = await vaultOverview(publicClient, typedVaultAddress, address);
      addOrReplaceVaults([data]);
    }
  };

  React.useEffect(() => {
    setOwnedVaults([]);
    refreshOwnedVaults();
  }, [address]);

  return React.useMemo(() => {
    return (
      <OwnedVaultsContext.Provider
        value={{
          ownedVaults,
          refreshOwnedVaults,
          refreshSpecificVault,
        }}
      >
        {props.children}
      </OwnedVaultsContext.Provider>
    );
  }, [ownedVaults]);
}

export function useOwnedVaults() {
  const context = React.useContext(OwnedVaultsContext);
  if (context === undefined) {
    throw new Error(
      "useOwnedVaults must be used within a OwnedVaultsContextProvider"
    );
  }
  return context;
}
