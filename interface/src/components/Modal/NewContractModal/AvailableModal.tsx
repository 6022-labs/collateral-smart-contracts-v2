import React from "react";
import { toast } from "react-toastify";
import Button from "@/components/Button/Button";
import { Field, Form, Formik } from "formik";
import { parseEther, parseUnits } from "viem";
import TextInput from "@/components/Input/TextInput";
import ErrorMessage from "@/components/ErrorMessage";
import { createVault } from "@/utils/rewardPool6022";
import NumberInput from "@/components/Input/NumberInput";
import DatetimeInput from "@/components/Input/DatetimeInput";
import { allowance, approve, getDecimals } from "@/utils/erc20";
import RadioGroupInput from "@/components/Input/RadioGroupInput";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useCreatedRewardPool } from "@/contexts/CreatedRewardPoolContext";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";

type AvailableModalProps = {
  handleClose: () => void;
};

export default function AvailableModal(props: Readonly<AvailableModalProps>) {
  const [error, setError] = React.useState<string | undefined>(undefined);

  const [allowanceValue, setAllowanceValue] = React.useState<bigint>(BigInt(0));
  const [needMoreAllowance, setNeedMoreAllowance] =
    React.useState<boolean>(false);

  const inOneYear = new Date();
  inOneYear.setFullYear(inOneYear.getFullYear() + 1);

  const { address = `0x${"default"}` } = useAccount();

  const publicClient = usePublicClient();
  const writeContract = useWriteContract();

  const { createdRewardPoolAddress = `0x${"default"}` } =
    useCreatedRewardPool();

  const checkAllowance = async () => {
    let value = await allowance(
      publicClient,
      import.meta.env.VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS,
      address,
      createdRewardPoolAddress
    );

    setAllowanceValue(value);

    return value;
  };

  const submitIncreaseAllowance = async (values: any) => {
    try {
      let hash = await approve(
        writeContract,
        import.meta.env.VITE_TOKEN_PROTOCOL_SMART_CONTRACT_ADDRESS,
        createdRewardPoolAddress,
        BigInt(2n ** 256n - 1n)
      );

      let receipt = await publicClient?.waitForTransactionReceipt({
        hash: hash,
      });

      if (receipt?.status === "reverted") {
        throw new Error("Transaction failed");
      }

      let value = await checkAllowance();

      if (value > parseEther(values.backedValueProtocolToken.toString())) {
        setNeedMoreAllowance(false);
      }

      setError(undefined);
    } catch (error: any) {
      console.error(error);
      toast.error("An error occurred, please try again.");
      setError("An error occurred, please try again.");
    }
  };

  const submitCreateVault = async (values: any) => {
    try {
      let wantedAmount = BigInt(values.wantedAmount);

      if (values.type === "erc20") {
        let decimals = await getDecimals(
          publicClient,
          values.wantedTokenAddress
        );

        wantedAmount = parseUnits(values.wantedAmount.toString(), decimals);
      }

      let hash = await createVault(
        writeContract,
        createdRewardPoolAddress,
        values.name,
        new Date(values.lockedUntil).getTime() / 1000,
        wantedAmount,
        values.wantedTokenAddress,
        parseUnits(values.backedValueProtocolToken.toString(), 18)
      );

      let receipt = await publicClient?.waitForTransactionReceipt({
        hash: hash,
      });

      if (receipt?.status === "reverted") {
        throw new Error("Transaction failed");
      }

      setError(undefined);
      props.handleClose();

      toast.success("Vault created successfully");
    } catch (error: any) {
      console.error(error);
      toast.error("An error occurred, please try again.");
      setError("An error occurred, please try again.");
    }
  };

  React.useEffect(() => {
    checkAllowance();
  }, [address]);

  return (
    <Formik
      initialValues={{
        name: "",
        type: "erc20",
        wantedAmount: "",
        wantedTokenAddress: "",
        backedValueProtocolToken: "",
        lockedUntil: inOneYear.toISOString().slice(0, 16),
      }}
      onSubmit={async (values) => {
        if (needMoreAllowance) {
          await submitIncreaseAllowance(values);
          return;
        }

        if (
          !values.wantedAmount ||
          !values.backedValueProtocolToken ||
          !values.wantedTokenAddress.startsWith("0x")
        ) {
          return;
        }

        await submitCreateVault(values);
      }}
    >
      {({
        values,
        errors,
        touched,
        isSubmitting,
        submitForm,
        handleChange,
      }) => {
        return (
          <Form className="flex flex-col gap-y-3 px-2">
            <div className="flex flex-col gap-y-2">
              <label htmlFor="name">Type of collateral*</label>
              <Field
                name="type"
                as={RadioGroupInput}
                choices={[
                  { label: "NFT", value: "erc721" },
                  { label: "Token", value: "erc20" },
                ]}
                validate={(value: string) => {
                  if (value !== "erc20" && value !== "erc721") {
                    return "Invalid type";
                  }
                }}
              />
              {errors.type && <ErrorMessage error={errors.type} />}
            </div>
            <div className="flex flex-col gap-y-2">
              <label htmlFor="name">Name*</label>
              <Field
                name="name"
                as={TextInput}
                validate={(value: string) => {
                  if (!value) {
                    return "Required";
                  }
                }}
                placeholder="FIAT 500 - GROUPAMA"
              />
              {touched.name && errors.name && (
                <ErrorMessage error={errors.name} />
              )}
            </div>
            <div className="flex flex-col gap-y-2">
              <label htmlFor="lockedUntil">Locked until*</label>
              <Field
                name="lockedUntil"
                as={DatetimeInput}
                asSingle={true}
                useRange={false}
                placeholder="test"
                validate={(value: string) => {
                  if (!value) {
                    return "Required";
                  }

                  if (new Date(value) < new Date()) {
                    return "Date must be in the future";
                  }
                }}
              />
              {touched.lockedUntil && errors.lockedUntil && (
                <ErrorMessage error={errors.lockedUntil} />
              )}
            </div>
            <div className="flex flex-col gap-y-2">
              <label htmlFor="wantedTokenAddress">
                {values.type === "erc20"
                  ? "Token address"
                  : "NFT collection address"}
                *
              </label>
              <Field
                as={TextInput}
                placeholder="0x..."
                name="wantedTokenAddress"
                validate={(value: string) => {
                  if (!value) {
                    return "Required";
                  }

                  let addressRegex = /^0x[a-fA-F0-9]{40}$/gm;

                  if (!addressRegex.test(value)) {
                    return "Invalid address";
                  }
                }}
              />
              {touched.wantedTokenAddress && errors.wantedTokenAddress && (
                <ErrorMessage error={errors.wantedTokenAddress} />
              )}
            </div>
            <div className="flex flex-col gap-y-2">
              <label htmlFor="wantedAmount">
                {values.type === "erc20" ? "Amount of tokens" : "NFT ID"}*
              </label>
              <Field
                name="wantedAmount"
                as={NumberInput}
                placeholder={values.type === "erc20" ? "1000" : "1"}
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
              {touched.wantedAmount && errors.wantedAmount && (
                <ErrorMessage error={errors.wantedAmount} />
              )}
            </div>
            <div className="flex flex-col gap-y-2">
              <label htmlFor="backedValueProtocolToken">
                Protocol token equivalent*
              </label>
              <Field
                name="backedValueProtocolToken"
                as={NumberInput}
                placeholder={1000}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  handleChange(e);

                  if (parseEther(e.target.value) > allowanceValue) {
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
              {touched.backedValueProtocolToken &&
                errors.backedValueProtocolToken && (
                  <ErrorMessage error={errors.backedValueProtocolToken} />
                )}
            </div>
            <div className="flex w-full justify-center gap-x-4">
              <Button
                type="button"
                onClick={() => {
                  props.handleClose();
                }}
                isLoading={isSubmitting}
              >
                Close
              </Button>
              <Button
                type="button"
                onClick={() => {
                  submitForm();
                }}
                isLoading={isSubmitting}
              >
                {needMoreAllowance ? (
                  <div className="flex justify-center items-center gap-x-2">
                    <div>Increase allowance</div>
                    <FontAwesomeIcon
                      title="Necessary to collect fees"
                      icon={faCircleExclamation}
                    />
                  </div>
                ) : (
                  <div>Create</div>
                )}
              </Button>
            </div>
            {error && (
              <div className="flex w-full px-8 justify-center">
                <div className="flex justify-center items-center gap-x-2 px-6 py-3 bg-red-600/40">
                  <FontAwesomeIcon icon={faCircleExclamation} />
                  <span>{error}</span>
                </div>
              </div>
            )}
          </Form>
        );
      }}
    </Formik>
  );
}
