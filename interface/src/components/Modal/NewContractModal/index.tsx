import Modal from "..";
import AvailableModal from "./AvailableModal";
import UnavailableModal from "./UnavailableModal";
import { ClassNameProps } from "@/types/ClassNameProps";
import { useCreatedRewardPool } from "@/contexts/CreatedRewardPoolContext";

type NewContractModalProps = ClassNameProps & {
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
};

export default function NewContractModal(
  props: Readonly<NewContractModalProps>
) {
  const { hasCreatedRewardPool, createdRewardPoolAddress } =
    useCreatedRewardPool();

  return (
    <Modal
      isOpen={props.isOpen}
      setOpen={props.setOpen}
      closeOnBackdropClick={true}
    >
      {(handleClose) => {
        return (
          <div className="bg-white min-w-lg px-4 text-black space-y-8 pb-4 pt-5 overflow-y-auto max-h-96 md:max-h-120 sm:p-6 sm:pb-4 md:min-w-lg">
            <div className="flex flex-col space-y-5">
              <div className="flex flex-col space-y-4">
                <h1 className="text-xl font-semibold">New contract</h1>
                <hr className="" />
                <div className="flex flex-col gap-y-3">
                  {hasCreatedRewardPool && createdRewardPoolAddress ? (
                    <AvailableModal handleClose={handleClose} />
                  ) : (
                    <UnavailableModal handleClose={handleClose} />
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }}
    </Modal>
  );
}
