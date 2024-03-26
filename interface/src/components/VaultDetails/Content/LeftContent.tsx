import React from "react";
import Card from "@/components/Card";
import { Vault } from "@/types/Vault";
import { roundWei } from "@/utils/wei";
import { toast } from "react-toastify";
import { getApproved } from "@/utils/erc721";
import Button from "@/components/Button/Button";
import ButtonLink from "@/components/ButtonLink";
import { allowance, approve } from "@/utils/erc20";
import { deposit, withdraw } from "@/utils/vault6022";
import { useOwnedVaults } from "@/contexts/OwnedVaultsContext";
import { useVaultDetails } from "@/contexts/VaultDetailsContext";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";

type LeftContentProps = {
  vault: Vault;
};

type VaultAction = {
  text: string;
  color?: string;
  disabled: boolean;
  onClick?: () => Promise<void>;
};

const LeftContent = React.forwardRef(
  (props: Readonly<LeftContentProps>, ref: React.Ref<HTMLDivElement>) => {
    const { address = `0x${"default"}` } = useAccount();

    const writeClient = useWriteContract();
    const publicClient = usePublicClient();

    const { nftOwners } = useVaultDetails();

    const { refreshSpecificVault } = useOwnedVaults();

    const [vaultAction, setVaultAction] = React.useState<
      VaultAction | undefined
    >();

    const depositAction = async () => {
      let isApproved = false;
      console.log("Running depositAction");

      console.log("Using address: ", address);
      console.log("Using vault: ", props.vault);

      console.log("Checking if approved");

      try {
        let allowed = await allowance(
          publicClient,
          props.vault.wantedTokenAddress,
          address,
          props.vault.address
        );

        console.log("allowed: ", allowed);
        console.log("wantedAmount: ", props.vault.wantedAmount);

        if (allowed >= props.vault.wantedAmount) {
          isApproved = true;
        }
      } catch {
        try {
          let approved = await getApproved(
            publicClient,
            props.vault.wantedTokenAddress,
            props.vault.wantedAmount
          );

          console.log("approved: ", approved);

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

      console.log("isApproved: ", isApproved);

      if (!isApproved) {
        try {
          let hash = await approve(
            writeClient,
            props.vault.wantedTokenAddress,
            props.vault.address,
            props.vault.wantedAmount
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

      console.log("Running deposit");

      try {
        let hash = await deposit(writeClient, props.vault.address);

        await publicClient?.waitForTransactionReceipt({
          hash: hash,
        });
      } catch {
        toast.error("An error occurred while deposit funds. Please try again.");
        return;
      }

      refreshSpecificVault(props.vault.address);
    };

    const withdrawAction = async () => {
      try {
        let hash = await withdraw(writeClient, props.vault.address);

        await publicClient?.waitForTransactionReceipt({
          hash: hash,
        });
      } catch (e) {
        console.error(e);
        toast.error(
          "An error occurred while withdrawing funds, please try again."
        );
        return;
      }

      refreshSpecificVault(props.vault.address);
    };

    const refreshVaultAction = () => {
      if (nftOwners.length > 0) {
        if (props.vault.isWithdrawn) {
          setVaultAction({
            disabled: true,
            text: "Claim Collateral",
          });

          return;
        } else if (props.vault.isDeposited) {
          if (props.vault.lockedUntil > new Date().getTime() / 1000) {
            let ownedByCurrentUser = nftOwners.filter(
              (nftOwner) => nftOwner === address
            );
            if (ownedByCurrentUser.length >= 2) {
              setVaultAction({
                disabled: false,
                text: "Claim Collateral",
                onClick: withdrawAction,
              });

              return;
            }

            setVaultAction({
              disabled: true,
              text: "Claim Collateral",
            });

            return;
          }

          setVaultAction({
            disabled: false,
            text: "Claim Collateral",
            onClick: withdrawAction,
          });
        } else {
          if (props.vault.lockedUntil > new Date().getTime() / 1000) {
            setVaultAction({
              disabled: false,
              onClick: depositAction,
              text: "Make Deposit",
            });

            return;
          }

          setVaultAction({
            disabled: true,
            text: "Make Deposit",
          });
        }
      }
    };

    React.useEffect(() => {
      refreshVaultAction();
    }, [nftOwners, props.vault.isDeposited, props.vault.isWithdrawn]);

    return (
      <div ref={ref} className="flex justify-between gap-x-4">
        <div className="flex flex-col justify-between">
          <ButtonLink
            target="_blank"
            className="h-fit w-full"
            href={`${import.meta.env.VITE_SCANNER_BASE_URL}/address/${
              props.vault.address
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
          <div className="flex gap-x-1 justify-center items-center">
            <span className="text-center">
              {roundWei(props.vault.collectedRewards, 18, 4)}
            </span>
            <span>T6022</span>
            <img
              alt="T6022-icon"
              src="/logo-32x32.png"
              className="h-2.5 w-2.5 md:h-5 md:w-5"
            />
          </div>
        </Card>
      </div>
    );
  }
);

export default LeftContent;
