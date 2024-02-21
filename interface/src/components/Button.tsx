import clsx from "clsx";
import { ClassNameProps } from "../types/ClassNameProps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faSpinner } from "@fortawesome/free-solid-svg-icons";

type ButtonProps = ClassNameProps & {
  onClick: () => void;
  isLoading?: boolean;
  type: "button" | "submit" | "reset";
  children: React.ReactNode | React.ReactNode[];
};

export default function Button(props: Readonly<ButtonProps>) {
  const className = clsx(
    props.className,
    "flex gap-x-2 justify-center items-center",
    "bg-slate-300 text-black border border-black",
    "w-fit whitespace-nowrap font-medium py-2 px-8",
    props.isLoading ? "opacity-80" : "hover:opacity-80"
  );

  return (
    <button
      type={props.type}
      className={className}
      onClick={props.onClick}
      disabled={props.isLoading}
    >
      {props.isLoading && <FontAwesomeIcon icon={faSpinner} spin={true} />}
      <>{props.children}</>
    </button>
  );
}
