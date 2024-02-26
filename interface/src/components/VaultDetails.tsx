import React from "react";
import Card from "./Card";
import NFTRow from "./NFTRow";
import { Address } from "viem";
import Button from "./Button/Button";
import { Vault } from "@/types/Vault";
import ButtonLink from "./ButtonLink";
import { toast } from "react-toastify";
import { getApproved } from "@/utils/erc721";
import { allowance, approve } from "@/utils/erc20";
import { deposit, ownerOf, withdraw } from "@/utils/vault6022";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

type VaultDetailsProps = {
  data: Vault;
};

type VaultAction = {
  text: string;
  color?: string;
  disabled: boolean;
  onClick?: () => Promise<void>;
};

export default function VaultDetails(props: Readonly<VaultDetailsProps>) {
  const { data } = props;
  const { address = `0x${"default"}` } = useAccount();

  const writeClient = useWriteContract();
  const publicClient = usePublicClient();

  const [nftOwners, setNftOwners] = React.useState<Address[]>([]);

  const [vaultAction, setVaultAction] = React.useState<
    VaultAction | undefined
  >();

  const depositAction = async () => {
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
    }
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
    }
  };

  React.useEffect(() => {
    if (address) {
      let ownerOfFirstPromise = ownerOf(publicClient, data.address, 1);
      let ownerOfSecondPromise = ownerOf(publicClient, data.address, 1);
      let ownerOfThirdPromise = ownerOf(publicClient, data.address, 1);

      Promise.all([
        ownerOfFirstPromise,
        ownerOfSecondPromise,
        ownerOfThirdPromise,
      ]).then((values) => {
        setNftOwners(values.map((value) => value as Address));
      });
    }
  }, []);

  React.useEffect(() => {
    if (nftOwners.length > 0) {
      let ownedByCurrentUser = nftOwners.filter(
        (nftOwner) => nftOwner === address
      );

      if (!data.isDeposited) {
        setVaultAction({
          disabled: false,
          color: "bg-green-600",
          onClick: depositAction,
          text: "Make the Deposit",
        });

        return;
      }

      if (data.lockedUntil > new Date().getTime() / 1000) {
        if (ownedByCurrentUser.length >= 2) {
          setVaultAction({
            disabled: false,
            text: "Take collateral",
            onClick: withdrawAction,
          });
        } else {
          setVaultAction({
            disabled: true,
            text: "Take collateral",
          });
        }
      } else {
        setVaultAction({
          disabled: false,
          color: "bg-green-600",
          text: "Take collateral",
          onClick: withdrawAction,
        });
      }
    }
  }, [nftOwners]);

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
            >
              {vaultAction.text}
            </Button>
          )}
        </div>
        <Card className="flex flex-col justify-center gap-y-4">
          <div className="text-center">Pending rewards</div>
          <div className="flex flex-col justify-center">
            <span className="text-center">
              {data.collectedRewards.toString()} T6022
            </span>
            <span className="text-center">=437,05 USD</span>
          </div>
        </Card>
      </div>
      <div className="flex gap-x-4">
        <Card className="flex flex-col justify-center gap-y-4">
          <div className="text-center">Collateral</div>
          <div className="flex flex-col justify-center">
            <span className="text-center">{`${data.balanceOfWantedToken.toString()} ${
              data.wantedTokenSymbol
            }`}</span>
            <span className="text-center">=3500 USD</span>
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
