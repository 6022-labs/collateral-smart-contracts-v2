import clsx from "clsx";
import React from "react";
import { Link } from "react-router-dom";
import { ClassNameProps } from "../types/ClassNameProps";
import UnderlineText from "./UnderlineText";

type HeaderLinkProps = ClassNameProps & {
  href: string;
  target?: string;
  current: boolean;
  children: React.ReactNode | React.ReactNode[];
};

export default function HeaderLink(props: Readonly<HeaderLinkProps>) {
  const className = clsx(props.className, "py-1");

  return (
    <Link to={props.href} target={props.target}>
      <UnderlineText className={className} keep={props.current}>
        {props.children}
      </UnderlineText>
    </Link>
  );
}
