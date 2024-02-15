import React from "react";
import { ClassNameProps } from "../types/ClassNameProps";

type HeaderButtonProps = ClassNameProps & {
  onClick: () => void;
  type: "button" | "submit" | "reset";
  children: React.ReactNode | React.ReactNode[];
};

export default function HeaderButton(props: Readonly<HeaderButtonProps>) {
  return (
    <button
      type={props.type}
      onClick={props.onClick}
      className={`bg-secondary w-fit whitespace-nowrap hover:opacity-60 text-white font-semibold text-sm py-2 px-4 rounded-lg ${props.className}`}
    >
      {props.children}
    </button>
  );
}
