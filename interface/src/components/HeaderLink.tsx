import clsx from "clsx";
import React from "react";
import { Link } from "react-router-dom";
import { ClassNameProps } from "../types/ClassNameProps";

type HeaderLinkProps = ClassNameProps & {
  href: string;
  current: boolean;
  children: React.ReactNode | React.ReactNode[];
};

export default function HeaderLink(props: Readonly<HeaderLinkProps>) {
  const className = clsx(
    props.className,
    "py-1 relative inline-block",
    "after:content[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-white after:origin-bottom-right",
    props.current
      ? "after:scale-x-100 after:origin-bottom-left"
      : "after:transition-transform after:duration-200 hover:after:scale-x-100 hover:after:origin-bottom-left"
  );

  return (
    <li className={className}>
      <Link to={props.href}>{props.children}</Link>
    </li>
  );
}
