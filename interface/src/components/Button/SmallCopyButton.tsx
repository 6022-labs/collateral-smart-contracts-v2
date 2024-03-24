import React from "react";
import SmallButton from "./SmallButton";
import { ClassNameProps } from "@/types/ClassNameProps";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCopy } from "@fortawesome/free-solid-svg-icons";

type SmallCopyButtonProps = ClassNameProps & {
  color?: string;
  disabled?: boolean;
  valueToCopy: string;
};

export default function SmallCopyButton(props: Readonly<SmallCopyButtonProps>) {
  const [isCopied, setIsCopied] = React.useState(false);

  return (
    <SmallButton
      type="button"
      color={props.color}
      className={props.className}
      onClick={() => {
        try {
          navigator.clipboard.writeText(props.valueToCopy);
          setIsCopied(true);
          setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        } catch (error) {
          console.error("Failed to copy", error);
        }
      }}
      disabled={isCopied || props.disabled}
    >
      <FontAwesomeIcon className="w-3 h-3" icon={isCopied ? faCheck : faCopy} />
    </SmallButton>
  );
}
