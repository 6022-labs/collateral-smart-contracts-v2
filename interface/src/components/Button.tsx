import { ClassNameProps } from "../types/ClassNameProps";

type ButtonProps = ClassNameProps & {
  onClick: () => void;
  type: "button" | "submit" | "reset";
  children: React.ReactNode | React.ReactNode[];
};

export default function Button(props: ButtonProps) {
  return (
    <button
      type={props.type}
      onClick={props.onClick}
      className={`bg-blue-500 w-fit whitespace-nowrap hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-lg ${props.className}`}
    >
      {props.children}
    </button>
  );
}
