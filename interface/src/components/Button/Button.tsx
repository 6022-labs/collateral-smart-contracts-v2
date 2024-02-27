import clsx from "clsx";
import BaseButton, { BaseButtonProps } from "./BaseButton";

export default function Button(props: Readonly<BaseButtonProps>) {
  const className = clsx(props.className, "w-fit whitespace-nowrap py-2 px-8");

  return (
    <BaseButton
      type={props.type}
      color={props.color}
      className={className}
      onClick={props.onClick}
      disabled={props.disabled}
      isLoading={props.isLoading}
    >
      {props.children}
    </BaseButton>
  );
}
