import React from "react";
import { parseEventLogs } from "viem";
import { toast } from "react-toastify";
import { approve } from "@/utils/erc20";
import Button from "@/components/Button/Button";
import { abi } from "@/abis/RewardPoolFactory6022";
import { usePublicClient, useWriteContract } from "wagmi";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createRewardPool } from "@/utils/rewardPoolFactory6022";
import { useCreatedRewardPool } from "@/contexts/CreatedRewardPoolContext";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";

type UnavailableModalProps = {
  handleClose: () => void;
};

export default function UnavailableModal(
  props: Readonly<UnavailableModalProps>
) {
  const publicClient = usePublicClient();
  const writeContract = useWriteContract();

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | undefined>(undefined);

  const { refreshCreatedRewardPool } = useCreatedRewardPool();

  return (
    <div className="flex flex-col gap-y-3 text-sm max-w-lg">
      <p>
        To initialize your first collateral contract, you must first create a
        reward pool.
      </p>
      <p>
        This reward pool will collect the fees in token 6022 with each contract
        creation and redistribute these fees as rewards to all users holding
        collateral during the lock-up period.
      </p>
      <p>
        As soon as your reward pool is initialized, you will be able to create
        contracts for your users so they can deposit their collateral.
      </p>
      <div className="flex justify-center gap-x-4">
        <Button
          type="button"
          isLoading={isLoading}
          onClick={() => {
            props.handleClose();
          }}
        >
          Close
        </Button>
        <Button
          type="button"
          isLoading={isLoading}
          onClick={async () => {
            try {
              setIsLoading(true);
              let hash = await createRewardPool(writeContract);
              let receipt = await publicClient?.waitForTransactionReceipt({
                hash: hash,
              });

              if (!receipt) {
                throw new Error("Transaction failed");
              }

              toast.success("RewardPool created !");
              const log = parseEventLogs({
                abi: abi,
                logs: receipt.logs,
                eventName: "RewardPoolCreated",
              })[0] as any;

              let rewardPoolAddress = log?.args?.rewardPool;

              if (!rewardPoolAddress) {
                throw new Error("RewardPool address not found");
              }

              hash = await approve(
                writeContract,
                import.meta.env.VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS,
                rewardPoolAddress,
                BigInt(2n ** 256n - 1n)
              );

              await publicClient?.waitForTransactionReceipt({
                hash: hash,
              });

              await refreshCreatedRewardPool();
            } catch (error: any) {
              console.error("Error while creating reward pool", error);
              setError("An error occurred, please try again.");
            } finally {
              setIsLoading(false);
            }
          }}
        >
          Create RewardPool
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
  );
}
