import Modal from ".";
import TextInput from "../Input/TextInput";
import ErrorMessage from "../ErrorMessage";
import { Field, Form, Formik } from "formik";
import NumberInput from "../Input/NumberInput";
import DatetimeInput from "../Input/DatetimeInput";
import RadioGroupInput from "../Input/RadioGroupInput";
import { ClassNameProps } from "@/types/ClassNameProps";
import Button from "../Button";

type NewContractModalProps = ClassNameProps & {
  isOpen: boolean;
  closeOnBackdropClick?: boolean;
  setOpen: (isOpen: boolean) => void;
};

export default function NewContractModal(
  props: Readonly<NewContractModalProps>
) {
  return (
    <Modal
      isOpen={props.isOpen}
      setOpen={props.setOpen}
      closeOnBackdropClick={true}
    >
      {(handleClose) => {
        return (
          <div className="bg-white min-w-lg px-4 text-black space-y-8 pb-4 pt-5 sm:p-6 sm:pb-4 md:min-w-lg">
            <div className="flex flex-col space-y-5">
              <div className="flex flex-col space-y-4">
                <h1 className="text-xl font-semibold">New contract</h1>
                <hr className="" />
                <div className="flex flex-col gap-y-3">
                  <Formik
                    initialValues={{
                      name: "",
                      type: "erc20",
                      lockedUntil: undefined,
                      wantedTokenAddress: "",
                      wantedAmount: undefined,
                      backedValueProtocolToken: undefined,
                    }}
                    onSubmit={() => {}}
                  >
                    {({ values, errors, touched, submitForm }) => {
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
                            {errors.type && (
                              <ErrorMessage error={errors.type} />
                            )}
                          </div>
                          <div className="flex flex-col gap-y-2">
                            <label htmlFor="name">Name*</label>
                            <Field
                              name="name"
                              as={TextInput}
                              placeholder="FIAT 500 - GROUPAMA"
                              validate={(value: string) => {
                                if (!value) {
                                  return "Required";
                                }
                              }}
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
                              }}
                            />
                            {touched.wantedTokenAddress &&
                              errors.wantedTokenAddress && (
                                <ErrorMessage
                                  error={errors.wantedTokenAddress}
                                />
                              )}
                          </div>
                          <div className="flex flex-col gap-y-2">
                            <label htmlFor="wantedAmount">
                              {values.type === "erc20"
                                ? "Amount of tokens"
                                : "NFT ID"}
                              *
                            </label>
                            <Field
                              name="wantedAmount"
                              as={NumberInput}
                              placeholder={
                                values.type === "erc20" ? "1000" : "1"
                              }
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
                                <ErrorMessage
                                  error={errors.backedValueProtocolToken}
                                />
                              )}
                          </div>
                          <div className="flex w-full justify-center">
                            <Button
                              type="button"
                              onClick={() => {
                                submitForm();
                              }}
                            >
                              Create
                            </Button>
                          </div>
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
