import Modal from ".";
import React from "react";
import { toast } from "react-toastify";
import { Field, Form, Formik } from "formik";
import Button from "@/components/Button/Button";
import { parseEther, parseEventLogs } from "viem";
import { allowance, approve } from "@/utils/erc20";
import { abi } from "@/abis/RewardPoolFactory6022";
import ErrorMessage from "@/components/ErrorMessage";
import { ClassNameProps } from "@/types/ClassNameProps";
import NumberInput from "@/components/Input/NumberInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { createRewardPool } from "@/utils/rewardPoolFactory6022";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useCreatedRewardPool } from "@/contexts/CreatedRewardPoolContext";

type CreateRewardPoolModalProps = ClassNameProps & {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
};

export default function CreateRewardPoolModal(
  props: Readonly<CreateRewardPoolModalProps>
) {
  const publicClient = usePublicClient();
  const writeContract = useWriteContract();
  const { address = `0x${"default"}` } = useAccount();

  const [error, setError] = React.useState<string | undefined>(undefined);

  const [allowanceValue, setAllowanceValue] = React.useState<bigint>(BigInt(0));
  const [needMoreAllowance, setNeedMoreAllowance] =
    React.useState<boolean>(false);

  const { refreshCreatedRewardPool } = useCreatedRewardPool();

  const checkAllowance = async () => {
    let value = await allowance(
      publicClient,
      import.meta.env.VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS,
      address,
      import.meta.env.VITE_REWARD_POOL_FACTORY_SMART_CONTRACT_ADDRESS
    );

    setAllowanceValue(value);

    return value;
  };

  const submitIncreaseAllowance = async (values: any) => {
    try {
      let hash = await approve(
        writeContract,
        import.meta.env.VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS,
        import.meta.env.VITE_REWARD_POOL_FACTORY_SMART_CONTRACT_ADDRESS,
        BigInt(2n ** 256n - 1n)
      );

      let receipt = await publicClient?.waitForTransactionReceipt({
        hash: hash,
      });

      if (receipt?.status === "reverted") {
        throw new Error("Transaction failed");
      }

      let value = await checkAllowance();

      if (value > parseEther(values.lifetimeVaultAmount.toString())) {
        setNeedMoreAllowance(false);
      }

      setError(undefined);
    } catch (error: any) {
      console.error(error);
      toast.error("An error occurred, please try again.");
      setError("An error occurred, please try again.");
    }
  };

  const submitCreateRewardPool = async (values: any) => {
    try {
      let lifetimeVaultAmount = parseEther(
        values.lifetimeVaultAmount.toString()
      );

      let hash = await createRewardPool(writeContract, lifetimeVaultAmount);
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
    }
  };

  React.useEffect(() => {
    checkAllowance();
  }, [address]);

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
                <h1 className="text-xl font-semibold">
                  Initialize reward pool
                </h1>
                <hr className="" />
                <div className="flex flex-col gap-y-3">
                  <div className="flex flex-col gap-y-3 text-sm max-w-lg">
                    <p>
                      To initialize your first collateral contract, you must
                      first create a reward pool.
                    </p>
                    <p>
                      This reward pool will collect the fees in token 6022 with
                      each contract creation and redistribute these fees as
                      rewards to all users holding collateral during the lock-up
                      period.
                    </p>
                    <p>
                      As soon as your reward pool is initialized, you will be
                      able to create contracts for your users so they can
                      deposit their collateral.
                    </p>
                    <Formik
                      initialValues={{
                        lifetimeVaultAmount: 0,
                      }}
                      onSubmit={async (values) => {
                        if (needMoreAllowance) {
                          await submitIncreaseAllowance(values);
                          return;
                        }

                        submitCreateRewardPool(values);
                      }}
                    >
                      {({
                        errors,
                        touched,
                        isSubmitting,
                        submitForm,
                        handleChange,
                      }) => {
                        return (
                          <Form className="flex w-full flex-col gap-y-3">
                            <div className="flex flex-col gap-y-2">
                              <label htmlFor="lifetimeVaultAmount">
                                Initial collateral in T6022*
                              </label>
                              <Field
                                name="lifetimeVaultAmount"
                                as={NumberInput}
                                placeholder={1000}
                                onChange={(
                                  e: React.ChangeEvent<HTMLInputElement>
                                ) => {
                                  handleChange(e);

                                  if (
                                    parseEther(e.target.value) > allowanceValue
                                  ) {
                                    setNeedMoreAllowance(true);
                                  } else {
                                    setNeedMoreAllowance(false);
                                  }
                                }}
                                validate={(value: string) => {
                                  if (isNaN(Number(value))) {
                                    return "Invalid number";
                                  }

                                  if (Number(value) <= 0) {
                                    return "Must be greater than 0";
                                  }

                                  if (!value) {
                                    return "Required";
                                  }
                                }}
                              />
                              {touched.lifetimeVaultAmount &&
                                errors.lifetimeVaultAmount && (
                                  <ErrorMessage
                                    error={errors.lifetimeVaultAmount}
                                  />
                                )}
                            </div>
                            <div className="flex w-full justify-center gap-x-4">
                              <Button
                                type="button"
                                isLoading={isSubmitting}
                                onClick={() => {
                                  handleClose();
                                }}
                              >
                                Close
                              </Button>
                              <Button
                                type="button"
                                isLoading={isSubmitting}
                                onClick={() => {
                                  submitForm();
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
                          </Form>
                        );
                      }}
                    </Formik>
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
