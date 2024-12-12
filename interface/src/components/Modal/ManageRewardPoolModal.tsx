import Modal from ".";
import React from "react";
import Button from "../Button/Button";
import { ClassNameProps } from "@/types/ClassNameProps";
import { usePublicClient, useWriteContract } from "wagmi";
import { getLifetimeVault } from "@/utils/rewardPool6022";
import { withdraw } from "@/utils/rewardPoolLifetimeVault6022";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useCreatedRewardPool } from "@/contexts/CreatedRewardPoolContext";

type RewardPoolManagementModalProps = ClassNameProps & {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
};

export default function RewardPoolManagementModal(
  props: Readonly<RewardPoolManagementModalProps>
) {
  const publicClient = usePublicClient();
  const writeContract = useWriteContract();

  const { createdRewardPoolAddress } = useCreatedRewardPool();

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const withdrawLifetimeVault = async () => {
    setIsLoading(true);
    try {
      const lifetimeVaultAddress = await getLifetimeVault(
        publicClient,
        createdRewardPoolAddress!
      );
      await withdraw(writeContract, lifetimeVaultAddress);
    } catch (error: any) {
      console.error("Error while creating reward pool", error);
      setError("An error occurred, please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      isOpen={props.isOpen}
      setOpen={props.setOpen}
      closeOnBackdropClick={true}
    >
      {(handleClose) => {
        return (
          <div className="bg-white px-4 text-black space-y-8 pb-4 pt-5 overflow-y-auto min-w-90-screen max-h-9/10-screen sm:min-w-lg sm:p-6 sm:pb-4">
            <div className="flex flex-col space-y-5">
              <div className="flex flex-col space-y-4">
                <h1 className="text-xl font-semibold">Manage reward pool</h1>
                <hr className="" />
                <div className="flex flex-col gap-y-3">
                  <div className="flex flex-col gap-y-3 text-sm max-w-lg">
                    <p>
                      You can withdraw your T6022 collateral but it will close
                      definitely the reward pool.
                    </p>
                    <p>
                      To withdraw your T6022, There should be no more rewardable
                      vault
                    </p>
                    <div className="flex w-full justify-center gap-x-4">
                      <Button
                        type="button"
                        isLoading={isLoading}
                        onClick={() => {
                          handleClose();
                        }}
                      >
                        Close
                      </Button>
                      <Button
                        type="button"
                        isLoading={isLoading}
                        onClick={() => {
                          withdrawLifetimeVault();
                        }}
                      >
                        Withdraw T6022
                      </Button>
                    </div>
                    {error && (
                      <div className="flex px-8 justify-center">
                        <div className="flex w-72 justify-center items-center gap-x-2 px-6 py-3 bg-red-600/40">
                          <FontAwesomeIcon icon={faCircleExclamation} />
                          <span className="text-wrap">{error}</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </Modal>
  );
}
