import clsx from "clsx";
import React from "react";
import { ClassNameProps } from "@/types/ClassNameProps";

type PaginationButtonProps = ClassNameProps & {
  current: boolean;
  onClick: () => void;
  children: React.ReactNode | React.ReactNode[];
};

export default function PaginationButton(
  props: Readonly<PaginationButtonProps>
) {
  const className = clsx(
    props.className,
    props.current ? "bg-slate-400" : "bg-slate-200",
    "text-black border border-black hover:bg-slate-100",
    "whitespace-nowrap font-medium flex justify-center items-center",
    "text-sm w-8 h-8 sm:text-base sm:w-10 sm:h-10"
  );

  return (
    <button type="button" className={className} onClick={props.onClick}>
      {props.children}
    </button>
  );
}
