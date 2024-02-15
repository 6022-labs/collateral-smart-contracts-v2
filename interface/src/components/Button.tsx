import clsx from "clsx";
import { ClassNameProps } from "../types/ClassNameProps";

type ButtonProps = ClassNameProps & {
  onClick: () => void;
  type: "button" | "submit" | "reset";
  children: React.ReactNode | React.ReactNode[];
};

export default function Button(props: Readonly<ButtonProps>) {
  const className = clsx(
    props.className,
    "bg-slate-300 text-black border border-black",
    "w-fit whitespace-nowrap hover:opacity-80 font-medium py-2 px-8"
  );

  return (
    <button type={props.type} className={className} onClick={props.onClick}>
      {props.children}
    </button>
  );
}
