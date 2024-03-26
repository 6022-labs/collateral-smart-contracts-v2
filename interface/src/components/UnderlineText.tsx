import clsx from "clsx";
import React from "react";
import { ClassNameProps } from "../types/ClassNameProps";

type UnderlineTextProps = ClassNameProps & {
  keep: boolean;
  children: React.ReactNode | React.ReactNode[];
};

export default function UnderlineText(props: Readonly<UnderlineTextProps>) {
  const className = clsx(
    props.className,
    "relative inline-block",
    "after:content[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-white after:origin-bottom-right",
    props.keep
      ? "after:scale-x-100 after:origin-bottom-left"
      : "after:transition-transform after:duration-200 hover:after:scale-x-100 hover:after:origin-bottom-left"
  );

  return <span className={className}>{props.children}</span>;
}
