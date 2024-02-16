import { ClassNameProps } from "@/types/ClassNameProps";
import { InputProps } from "@/types/InputProps";

type NumberInputProps = ClassNameProps &
  InputProps & {
    value: number;
    placeholder?: string;
  };

export default function NumberInput(props: NumberInputProps) {
  return (
    <input
      type="number"
      name={props.name}
      value={props.value}
      onBlur={props.onBlur}
      required={props.required}
      disabled={props.disabled}
      onChange={props.onChange}
      placeholder={props.placeholder}
      className="w-full rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none p-3"
    />
  );
}
