import clsx from "clsx";
import React from "react";
import { ClassNameProps } from "@/types/ClassNameProps";
import { animationsComplete } from "@/utils/animations";

type ModalProps = ClassNameProps & {
  isOpen: boolean;
  closeOnBackdropClick?: boolean;
  setOpen: (isOpen: boolean) => void;
  children: (handleClose: () => void) => React.ReactNode;
};

export default function Modal(props: ModalProps) {
  const className = clsx(
    "relative transform overflow-hidden rounded-2xl text-left transition-all sm:max-w-lg",
    props.className
  );

  const dialogRef = React.useRef<HTMLDialogElement>(null);

  React.useEffect(() => {
    if (props.isOpen) {
      dialogRef.current?.showModal();
      dialogRef.current?.classList.remove("animate-scale-out");
      dialogRef.current?.classList.add("animate-fade-in-down");
    }
  }, [props.isOpen]);

  const handleClose = async () => {
    if (!dialogRef.current) return;
    dialogRef.current?.classList.add("animate-scale-out");
    dialogRef.current?.classList.remove("animate-fade-in-down");

    await animationsComplete(dialogRef.current);

    dialogRef.current?.close();
    props.setOpen(false);
  };

  return (
    <>
      {props.isOpen && (
        <dialog
          ref={dialogRef}
          onClose={async () => {
            await handleClose();
          }}
          onClick={async (e) => {
            if (!props.closeOnBackdropClick || !dialogRef.current) return;
            let rect = dialogRef.current.getBoundingClientRect();
            let isInDialog =
              rect.top <= e.clientY &&
              e.clientY <= rect.top + rect.height &&
              rect.left <= e.clientX &&
              e.clientX <= rect.left + rect.width;
            if (!isInDialog) {
              await handleClose();
            }
          }}
          className="p-0 bg-transparent backdrop:bg-black backdrop:opacity-30"
        >
          <div className="flex items-end justify-center overflow-y-auto text-center sm:items-center sm:p-0">
            <div className={className}>{props.children(handleClose)}</div>
          </div>
        </dialog>
      )}
    </>
  );
}
