import clsx from "clsx";
import React from "react";
import { ClassNameProps } from "@/types/ClassNameProps";

type CardProps = ClassNameProps & {
  children: React.ReactNode | React.ReactNode[];
};

export default function Card(props: Readonly<CardProps>) {
  const className = clsx(
    props.className,
    "bg-slate-200 text-black border border-black",
    "w-fit whitespace-nowrap font-medium py-2 px-8"
  );

  return <div className={className}>{props.children}</div>;
}
