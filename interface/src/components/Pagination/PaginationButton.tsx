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
    props.current && "bg-slate-400",
    "bg-slate-200 text-black border border-black hover:bg-slate-100",
    "whitespace-nowrap font-medium w-10 h-10 flex justify-center items-center"
  );

  return (
    <button type="button" className={className} onClick={props.onClick}>
      {props.children}
    </button>
  );
}
