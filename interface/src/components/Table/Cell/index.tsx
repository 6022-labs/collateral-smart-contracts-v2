import clsx from "clsx";
import React from "react";
import { ClassNameProps } from "../../../types/ClassNameProps";

export type CellProps = ClassNameProps & {
  children: React.ReactNode;
};

export default function Cell(props: Readonly<CellProps>) {
  const className = clsx("text-center py-3", props.className);
  return <td className={className}>{props.children}</td>;
}
