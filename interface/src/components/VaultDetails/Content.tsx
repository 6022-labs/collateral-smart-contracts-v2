import React from "react";
import Card from "../Card";
import NFTRow from "./NFTRow";
import Button from "../Button/Button";
import { Vault } from "@/types/Vault";
import ButtonLink from "../ButtonLink";
import { toast } from "react-toastify";
import { roundWei } from "@/utils/wei";
import { getApproved } from "@/utils/erc721";
import { allowance, approve } from "@/utils/erc20";
import { deposit, withdraw } from "@/utils/vault6022";
import { useOwnedVaults } from "@/contexts/OwnedVaultsContext";
import { useVaultDetails } from "@/contexts/VaultDetailsContext";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

type ContentProps = {
  data: Vault;
};

type VaultAction = {
  text: string;
  color?: string;
  disabled: boolean;
  onClick?: () => Promise<void>;
};

export default function Content(props: Readonly<ContentProps>) {
  const { data } = props;
  const { address = `0x${"default"}` } = useAccount();

  const writeClient = useWriteContract();
  const publicClient = usePublicClient();

  const { nftOwners } = useVaultDetails();
  const { refreshSpecificVault } = useOwnedVaults();

  const [vaultAction, setVaultAction] = React.useState<
    VaultAction | undefined
  >();

  const depositAction = async () => {
    refreshSpecificVault(data.address);

    let isApproved = false;
    try {
      let allowed = await allowance(
        publicClient,
        data.wantedTokenAddress,
        address,
        data.address
      );

      if (allowed >= data.wantedAmount) {
        isApproved = true;
      }
    } catch {
      try {
        let approved = await getApproved(
          publicClient,
          data.wantedTokenAddress,
          data.wantedAmount
        );

        if (approved === address) {
          isApproved = true;
        }
      } catch {
        toast.error(
          "An error occurred while fetching approval data. Please try again."
        );
        return;
      }
    }

    if (!isApproved) {
      try {
        let hash = await approve(
          writeClient,
          data.wantedTokenAddress,
          data.address,
          data.wantedAmount
        );

        await publicClient?.waitForTransactionReceipt({
          hash: hash,
        });
      } catch (e) {
        console.error(e);
        toast.error(
          "An error occurred while approving smart contract. Please try again."
        );
        return;
      }
    }

    try {
      let hash = await deposit(writeClient, data.address);

      await publicClient?.waitForTransactionReceipt({
        hash: hash,
      });
    } catch {
      toast.error("An error occurred while deposit funds. Please try again.");
      return;
    }

    refreshSpecificVault(data.address);
  };

  const withdrawAction = async () => {
    try {
      let hash = await withdraw(writeClient, data.address);

      await publicClient?.waitForTransactionReceipt({
        hash: hash,
      });
    } catch {
      toast.error(
        "An error occurred while withdrawing funds, please try again."
      );
      return;
    }

    refreshSpecificVault(data.address);
  };

  const refreshVaultAction = () => {
    if (nftOwners.length > 0) {
      if (data.isWithdrawn) {
        setVaultAction({
          disabled: true,
          text: "Take collateral",
        });

        return;
      } else if (data.isDeposited) {
        if (data.lockedUntil > new Date().getTime() / 1000) {
          let ownedByCurrentUser = nftOwners.filter(
            (nftOwner) => nftOwner === address
          );
          if (ownedByCurrentUser.length >= 2) {
            setVaultAction({
              disabled: false,
              text: "Take collateral",
              onClick: withdrawAction,
            });

            return;
          }

          setVaultAction({
            disabled: true,
            text: "Take collateral",
          });

          return;
        }

        setVaultAction({
          disabled: false,
          color: "bg-green-600",
          text: "Take collateral",
        });
      } else {
        if (data.lockedUntil > new Date().getTime() / 1000) {
          setVaultAction({
            disabled: false,
            color: "bg-green-600",
            onClick: depositAction,
            text: "Make the Deposit",
          });

          return;
        }

        setVaultAction({
          disabled: true,
          text: "Make the Deposit",
        });
      }
    }
  };

  React.useEffect(() => {
    refreshVaultAction();
  }, [nftOwners, props.data]);

  return (
    <div className="flex justify-between text-sm p-5">
      <div className="flex gap-x-4">
        <div className="flex flex-col h-full justify-between">
          <ButtonLink
            target="_blank"
            className="h-fit w-full"
            href={`${import.meta.env.VITE_SCANNER_BASE_URL}/address/${
              data.address
            }`}
          >
            View contract
          </ButtonLink>
          {vaultAction && (
            <Button
              type="button"
              className="h-fit w-full"
              color={vaultAction.color}
              onClick={vaultAction.onClick}
              disabled={vaultAction.onClick === undefined}
            >
              {vaultAction.text}
            </Button>
          )}
        </div>
        <Card className="flex flex-col justify-center gap-y-4">
          <div className="text-center">Pending rewards</div>
          <div className="flex flex-col justify-center">
            <span className="text-center">
              {roundWei(data.collectedRewards, 18, 4)} T6022
            </span>
            <span className="text-center">≈437,05 USD</span>
          </div>
        </Card>
      </div>
      <div className="flex gap-x-4">
        <Card className="flex flex-col justify-center gap-y-4">
          <div className="text-center">Collateral</div>
          <div className="flex flex-col justify-center">
            <span className="text-center">{`${roundWei(
              data.balanceOfWantedToken,
              data.wantedTokenDecimals,
              4
            )} ${data.wantedTokenSymbol}`}</span>
            <span className="text-center">≈3500 USD</span>
          </div>
        </Card>
        <div className="flex flex-col justify-between h-full">
          {nftOwners.map((owner, index) => {
            return (
              <NFTRow
                key={index}
                owner={owner}
                tokenId={BigInt(index + 1)}
                smartContractAddress={data.address}
                displaySendButton={
                  index === 0 &&
                  nftOwners.find((nftOwner) => nftOwner !== address) ===
                    undefined
                }
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
