import clsx from "clsx";
import { ClassNameProps } from "@/types/ClassNameProps";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export type BaseButtonProps = ClassNameProps & {
  color?: string;
  disabled?: boolean;
  isLoading?: boolean;
  onClick?: () => void;
  type: "button" | "submit" | "reset";
  children: React.ReactNode | React.ReactNode[];
};

export default function BaseButton(props: Readonly<BaseButtonProps>) {
  const className = clsx(
    props.className,
    "border border-black font-medium",
    "flex gap-x-2 justify-center items-center",
    props.isLoading || props.disabled ? "opacity-80" : "hover:opacity-80",
    props.color ?? "bg-slate-200 text-black"
  );

  return (
    <button
      type={props.type}
      className={className}
      onClick={props.onClick}
      disabled={props.isLoading ?? props.disabled}
    >
      {props.isLoading && <FontAwesomeIcon icon={faSpinner} spin={true} />}
      {props.children}
    </button>
  );
}
