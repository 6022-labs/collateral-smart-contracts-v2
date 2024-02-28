import clsx from "clsx";
import React from "react";
import { ClassNameProps } from "@/types/ClassNameProps";

type CardProps = ClassNameProps & {
  ref?: React.RefObject<HTMLDivElement>;
  children: React.ReactNode | React.ReactNode[];
};

export default function Card(props: Readonly<CardProps>) {
  const className = clsx(
    props.className,
    "card bg-slate-200 text-black border border-black",
    "whitespace-nowrap font-medium py-2 px-4 md:px-6 lg:px-8"
  );

  return (
    <div ref={props.ref} className={className}>
      {props.children}
    </div>
  );
}
