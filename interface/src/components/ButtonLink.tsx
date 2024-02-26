import clsx from "clsx";
import { ClassNameProps } from "../types/ClassNameProps";

type ButtonLinkProps = ClassNameProps & {
  href?: string;
  target?: string;
  children: React.ReactNode | React.ReactNode[];
};

export default function ButtonLink(props: Readonly<ButtonLinkProps>) {
  const className = clsx(
    props.className,
    "flex justify-center items-center",
    "bg-slate-200 text-black border border-black",
    "w-fit whitespace-nowrap font-medium py-2 px-8 hover:opacity-80"
  );

  return (
    <a href={props.href} className={className} target={props.target}>
      {props.children}
    </a>
  );
}
