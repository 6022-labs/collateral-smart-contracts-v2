import { ClassNameProps } from "@/types/ClassNameProps";
import { InputProps } from "@/types/InputProps";

type TextInputProps = ClassNameProps &
  InputProps & {
    value: string;
    placeholder?: string;
  };

export default function TextInput(props: TextInputProps) {
  return (
    <input
      type="text"
      name={props.name}
      value={props.value}
      onBlur={props.onBlur}
      required={props.required}
      disabled={props.disabled}
      onChange={props.onChange}
      placeholder={props.placeholder}
      className="w-full rounded border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none p-3"
    />
  );
}
