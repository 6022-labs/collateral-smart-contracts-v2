import React from "react";
import { Address } from "viem";
import Table from "@/components/Table";
import Button from "@/components/Button";
import { Row } from "@/components/Table/Row";
import { Cell } from "@/components/Table/Cell";
import Pagination from "@/components/Pagination";
import { fetchVaultData } from "@/utils/vault6022";
import { useAccount, usePublicClient } from "wagmi";
import VaultDetails from "@/components/VaultDetails";
import { fetchOwnedVaults } from "@/utils/controller6022";
import NewContractModal from "@/components/Modal/NewContractModal";

export default function Main() {
  const { address } = useAccount();
  const client = usePublicClient();
  const elementsPerPage = 10;

  const [ownedVaults, setOwnedVaults] = React.useState<string[]>([]);
  const [newContractModalIsOpen, setNewContractModalIsOpen] =
    React.useState<boolean>(false);

  const fetchVaultsData = async (page: number) => {
    let allPromises = [];

    for (
      let i = page * elementsPerPage - 1;
      i < (page + 1) * elementsPerPage;
      i++
    ) {
      if (ownedVaults[i]) {
        let userAddress = address as Address;
        let vaultAddress = ownedVaults[i] as Address;
        allPromises.push(
          fetchVaultData(client, vaultAddress, userAddress).catch((e) =>
            console.error(e)
          )
        );
      }
    }

    let data = await Promise.all(allPromises);

    console.log(data);
  };

  React.useEffect(() => {
    if (!address) return;
    (async () => {
      const data = await fetchOwnedVaults(client, address);
      setOwnedVaults(data);
    })();
  }, [address]);

  React.useEffect(() => {
    fetchVaultsData(1);
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
              { name: "Status" },
              { name: "Start date" },
              { name: "End date" },
              { name: "NFT owned by me" },
              { name: "Name" },
            ]}
          >
            <Row
              collapsible={true}
              collapsedContent={<VaultDetails data={undefined} />}
              onClick={(setCollapsed) => {
                setCollapsed((prev) => !prev);
              }}
            >
              <Cell>Test</Cell>
              <Cell>Test</Cell>
              <Cell>Test</Cell>
              <Cell>Test</Cell>
              <Cell>Test</Cell>
              <Cell>Test</Cell>
            </Row>
          </Table>
          {ownedVaults.length > elementsPerPage && (
            <div className="flex w-full justify-end mt-5">
              <Pagination
                onPaginate={fetchVaultsData}
                pages={Math.ceil(ownedVaults.length / elementsPerPage)}
              />
            </div>
          )}
        </div>
      </div>
      <NewContractModal
        closeOnBackdropClick={true}
        isOpen={newContractModalIsOpen}
        setOpen={setNewContractModalIsOpen}
      />
    </>
  );
}
