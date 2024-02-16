import { InputProps } from "@/types/InputProps";
import { ClassNameProps } from "@/types/ClassNameProps";

type DatetimeInputProps = ClassNameProps &
  InputProps & {
    min?: string;
    placeholder?: string;
  };

export default function DatetimeInput(props: DatetimeInputProps) {
  return (
    <input
      min={props.min}
      name={props.name}
      value={props.value}
      type="datetime-local"
      onBlur={props.onBlur}
      required={props.required}
      disabled={props.disabled}
      onChange={props.onChange}
      placeholder={props.placeholder}
      className="w-full rounded-lg border border-gray-300 focus:border-primary focus:ring-2 focus:ring-primary focus:outline-none p-3"
    />
  );
}
