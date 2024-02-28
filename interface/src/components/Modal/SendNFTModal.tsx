import Modal from ".";
import React from "react";
import { Address } from "viem";
import Button from "../Button/Button";
import { toast } from "react-toastify";
import ErrorMessage from "../ErrorMessage";
import TextInput from "../Input/TextInput";
import { Field, Form, Formik } from "formik";
import { safeTransferFrom } from "@/utils/vault6022";
import { ClassNameProps } from "@/types/ClassNameProps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useAccount, usePublicClient, useWriteContract } from "wagmi";
import { faCircleExclamation } from "@fortawesome/free-solid-svg-icons";
import { useVaultDetails } from "@/contexts/VaultDetailsContext";
import { useOwnedVaults } from "@/contexts/OwnedVaultsContext";

type SendNFTModalProps = ClassNameProps & {
  isOpen: boolean;
  tokenIdToSend: bigint;
  smartContractAddress: Address;
  setOpen: (isOpen: boolean) => void;
};

export default function SendNFTModal(props: Readonly<SendNFTModalProps>) {
  const { refreshNftOwners } = useVaultDetails();
  const { refreshSpecificVault } = useOwnedVaults();
  const { address = `0x${"default"}` } = useAccount();

  const writeClient = useWriteContract();
  const publicClient = usePublicClient();

  const [error, setError] = React.useState<string>();

  return (
    <Modal
      isOpen={props.isOpen}
      setOpen={props.setOpen}
      closeOnBackdropClick={true}
    >
      {(handleClose) => {
        return (
          <div className="bg-white sm:min-w-lg px-4 text-black space-y-8 pb-4 pt-5 overflow-y-auto min-w-90-screen max-h-96 sm:min-w-lg md:max-h-120 sm:p-6 sm:pb-4">
            <div className="flex flex-col space-y-5">
              <div className="flex flex-col space-y-4">
                <h1 className="text-xl font-semibold">Send Vault NFT</h1>
                <hr className="" />
                <div className="flex flex-col gap-y-3">
                  <Formik
                    initialValues={{
                      address: "",
                    }}
                    onSubmit={async (values) => {
                      const typedAddress = values.address as Address;

                      try {
                        let hash = await safeTransferFrom(
                          writeClient,
                          props.smartContractAddress,
                          address,
                          typedAddress,
                          props.tokenIdToSend
                        );

                        await publicClient?.waitForTransactionReceipt({
                          hash: hash,
                        });

                        refreshSpecificVault(props.smartContractAddress);
                        refreshNftOwners();
                        handleClose();
                      } catch (e) {
                        console.error(e);
                        toast.error("An error occurred, please try again.");
                        setError("An error occurred, please try again.");
                      }
                    }}
                  >
                    {({ errors, touched, isSubmitting, submitForm }) => {
                      return (
                        <Form className="flex flex-col gap-y-3 px-2">
                          <div className="flex flex-col gap-y-2">
                            <label htmlFor="address">Address</label>
                            <Field
                              as={TextInput}
                              placeholder="0x..."
                              name="address"
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
                            {touched.address && errors.address && (
                              <ErrorMessage error={errors.address} />
                            )}
                          </div>
                          <div className="flex w-full justify-center gap-x-4">
                            <Button
                              type="button"
                              onClick={() => {
                                handleClose();
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
                              Send
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
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </Modal>
  );
}
