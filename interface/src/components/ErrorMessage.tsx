import clsx from "clsx";
import { ClassNameProps } from "@/types/ClassNameProps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCircleInfo } from "@fortawesome/free-solid-svg-icons";

type ErrorMessageProps = ClassNameProps & {
  error: string;
};

export default function ErrorMessage(props: ErrorMessageProps) {
  const className = clsx(
    "text-red-500 flex items-center gap-x-1",
    props.className
  );
  return (
    <div className={className}>
      <FontAwesomeIcon icon={faCircleInfo} />
      {props.error}
    </div>
  );
}
