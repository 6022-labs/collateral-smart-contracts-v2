import React from "react";
import { useAccount } from "wagmi";
import { Vault } from "@/types/Vault";
import Table from "@/components/Table";
import Row from "@/components/Table/Row";
import Cell from "@/components/Table/Cell";
import Button from "@/components/Button/Button";
import Pagination from "@/components/Pagination";
import VaultDetails from "@/components/VaultDetails";
import { truncateEthAddress } from "@/utils/eth-address";
import TokenCell from "@/components/Table/Cell/TokenCell";
import { useOwnedVaults } from "@/contexts/OwnedVaultsContext";
import DateTimeCell from "@/components/Table/Cell/DateTimeCell";
import NewContractModal from "@/components/Modal/NewContractModal";

export default function Main() {
  const elementsPerPage = 10;

  const { address } = useAccount();
  const { ownedVaults } = useOwnedVaults();

  const [currentPage, setCurrentPage] = React.useState(1);

  const [vaultsToDisplay, setVaultsToDisplay] = React.useState<Vault[]>([]);
  const [newContractModalIsOpen, setNewContractModalIsOpen] =
    React.useState<boolean>(false);

  const getVaultStatus = (vault: Vault) => {
    if (vault.isWithdrawn) {
      return <span className="text-lime-green">Withdrawn</span>;
    } else if (vault.isDeposited) {
      if (vault.lockedUntil > new Date().getTime() / 1000) {
        return <span className="text-red-600">Lock-up Period</span>;
      }

      return <span className="text-lime-green">Unlocked</span>;
    } else {
      if (vault.lockedUntil > new Date().getTime() / 1000) {
        return <span>Awaiting Collateral</span>;
      }

      return <span className="text-red-600">Too late</span>;
    }
  };

  const paginateVaultsToDisplay = (page: number) => {
    let start = (page - 1) * elementsPerPage;
    let end = start + elementsPerPage;
    setVaultsToDisplay([...ownedVaults.slice(start, end)]);
  };

  React.useEffect(() => {
    paginateVaultsToDisplay(currentPage);
  }, [ownedVaults, currentPage]);

  return (
    <>
      <div className="py-8 px-4 lg:px-32">
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
              { name: "Storage", className: "hidden md:table-cell" },
              {
                name: "Initial Collateral Value (T6022)",
                className: "hidden md:table-cell",
              },
              { name: "Status" },
              { name: "Start date" },
              { name: "End date" },
              { name: "Creator", className: "hidden sm:table-cell" },
              { name: "Keys owned by me", className: "hidden sm:table-cell" },
              { name: "Contract name" },
            ]}
          >
            {vaultsToDisplay.map((vault) => {
              return (
                <Row
                  // Key must be very complex for rerendering reasons
                  key={`${address}-${vault.address}-${vault.isDeposited}-${vault.isWithdrawn}`}
                  collapsible={true}
                  collapsedContent={<VaultDetails data={vault} />}
                  onClick={(setCollapsed) => {
                    setCollapsed((prev) => !prev);
                  }}
                >
                  <TokenCell
                    type="coin"
                    amount={vault.wantedAmount}
                    symbol={vault.wantedTokenSymbol}
                    decimals={vault.wantedTokenDecimals}
                    smartContractAddress={vault.wantedTokenAddress}
                  />
                  <Cell className="hidden md:table-cell">
                    {vault.isWithdrawn || !vault.isDeposited ? "Empty" : "Full"}
                  </Cell>
                  <TokenCell
                    type="coin"
                    decimals={18}
                    symbol="T6022"
                    imageUrl="/logo-32x32.png"
                    className="hidden md:table-cell"
                    amount={vault.backedValueProtocolToken}
                    smartContractAddress={
                      import.meta.env.VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS
                    }
                  />
                  <Cell>{getVaultStatus(vault)}</Cell>
                  <DateTimeCell timestamp={vault.creationTimestamp} />
                  <DateTimeCell timestamp={vault.lockedUntil} />
                  <Cell className="hidden sm:table-cell">
                    <a
                      target="_blank"
                      className="underline hover:text-bright-blue"
                      href={`${import.meta.env.VITE_SCANNER_BASE_URL}/address/${
                        vault.creator
                      }`}
                    >
                      {truncateEthAddress(vault.creator, 8, 8)}
                    </a>
                  </Cell>
                  <Cell className="hidden sm:table-cell">
                    {vault.ownedNFTs.toString()}
                  </Cell>
                  <Cell>{vault.name}</Cell>
                </Row>
              );
            })}
          </Table>
          {ownedVaults.length > elementsPerPage && (
            <div className="flex w-full justify-end mt-5">
              <Pagination
                currentPage={currentPage}
                onPaginate={(page) => {
                  setCurrentPage(page);
                }}
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
