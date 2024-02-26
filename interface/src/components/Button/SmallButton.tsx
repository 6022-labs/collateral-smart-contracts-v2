import clsx from "clsx";
import BaseButton, { BaseButtonProps } from "./BaseButton";

export default function Button(props: Readonly<BaseButtonProps>) {
  const className = clsx(props.className, "w-fit whitespace-nowrap px-4");

  return (
    <BaseButton
      type={props.type}
      color={props.color}
      className={className}
      onClick={props.onClick}
      isLoading={props.isLoading}
    >
      {props.children}
    </BaseButton>
  );
}
