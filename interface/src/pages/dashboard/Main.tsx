import React from "react";
import { formatUnits } from "viem";
import { Vault } from "@/types/Vault";
import Table from "@/components/Table";
import { Row } from "@/components/Table/Row";
import { Cell } from "@/components/Table/Cell";
import Button from "@/components/Button/Button";
import Pagination from "@/components/Pagination";
import VaultDetails from "@/components/VaultDetails";
import { useOwnedVaults } from "@/contexts/OwnedVaultsContext";
import NewContractModal from "@/components/Modal/NewContractModal";

export default function Main() {
  const elementsPerPage = 10;

  const { ownedVaults } = useOwnedVaults();

  const [vaultsToDisplay, setVaultsToDisplay] = React.useState<Vault[]>([]);

  const [newContractModalIsOpen, setNewContractModalIsOpen] =
    React.useState<boolean>(false);

  const getVaultStatus = (vault: Vault) => {
    if (vault.isWithdrawn) {
      return <span className="text-green-600">Withdrawn</span>;
    } else if (vault.isDeposited) {
      if (vault.lockedUntil > new Date().getTime() / 1000) {
        return <span className="text-red-600">Locked period</span>;
      }

      return <span className="text-green-600">Unlocked</span>;
    } else {
      if (vault.lockedUntil > new Date().getTime() / 1000) {
        return <span>Waiting for deposit</span>;
      }

      return <span className="text-red-600">Too late</span>;
    }
  };

  const paginateVaultsToDisplay = (page: number) => {
    let start = (page - 1) * elementsPerPage;
    let end = start + elementsPerPage;
    setVaultsToDisplay(ownedVaults.slice(start, end));
  };

  React.useEffect(() => {
    paginateVaultsToDisplay(1);
  }, [ownedVaults]);

  return (
    <>
      <div className="py-8 px-32">
        <div className="flex flex-row-reverse gap-x-4 w-full">
          <Button
            onClick={() => {
              setNewContractModalIsOpen(true);
            }}
            type="button"
          >
            New Contract
          </Button>
        </div>
        <div className="py-10">
          <Table
            columns={[
              { name: "Collateral" },
              { name: "C. Initial value (T6022)" },
              { name: "Status" },
              { name: "Start date" },
              { name: "End date" },
              { name: "NFT owned by me" },
              { name: "Name" },
            ]}
          >
            {vaultsToDisplay.map((vault) => {
              return (
                <Row
                  key={vault.address}
                  collapsible={true}
                  collapsedContent={<VaultDetails data={vault} />}
                  onClick={(setCollapsed) => {
                    setCollapsed((prev) => !prev);
                  }}
                >
                  <Cell>
                    <div className="flex justify-center items-center gap-x-1">
                      <span>
                        {formatUnits(
                          vault.wantedAmount,
                          vault.wantedTokenDecimals
                        )}
                      </span>
                      <span>{vault.wantedTokenSymbol}</span>
                    </div>
                  </Cell>
                  <Cell>{formatUnits(vault.backedValueProtocolToken, 18)}</Cell>
                  <Cell>{getVaultStatus(vault)}</Cell>
                  <Cell>
                    {new Date(
                      Number(vault.creationTimestamp) * 1000
                    ).toLocaleDateString()}
                  </Cell>
                  <Cell>
                    {new Date(
                      Number(vault.lockedUntil) * 1000
                    ).toLocaleDateString()}
                  </Cell>
                  <Cell>{vault.ownedNFTs.toString()}</Cell>
                  <Cell>{vault.name}</Cell>
                </Row>
              );
            })}
          </Table>
          {ownedVaults.length > elementsPerPage && (
            <div className="flex w-full justify-end mt-5">
              <Pagination
                onPaginate={paginateVaultsToDisplay}
                pages={Math.ceil(ownedVaults.length / elementsPerPage)}
              />
            </div>
          )}
        </div>
      </div>
      <NewContractModal
        isOpen={newContractModalIsOpen}
        setOpen={setNewContractModalIsOpen}
      />
    </>
  );
}
