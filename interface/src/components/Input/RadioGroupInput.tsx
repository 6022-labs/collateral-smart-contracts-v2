import { InputProps } from "@/types/InputProps";
import { ClassNameProps } from "@/types/ClassNameProps";

type Choice = {
  label: string;
  value: string;
};

type RadioGroupInputProps = ClassNameProps &
  InputProps & {
    value: string;
    choices: Choice[];
  };

export default function RadioGroupInput(props: RadioGroupInputProps) {
  return (
    <div className="flex w-fit justify-around items-center rounded-xl">
      {props.choices.map((choice, index) => (
        <label
          key={choice.value}
          className={`flex items-center justify-center cursor-pointer py-2 px-8 border-y-2 border-r-2 border-very-black ${
            props.value === choice.value
              ? "bg-very-black text-white"
              : "bg-slate-200 hover:bg-very-black hover:text-white"
          } ${index === 0 ? "rounded-l border-l-2" : ""} ${
            index === props.choices.length - 1 ? "rounded-r" : ""
          }`}
        >
          <input
            type="radio"
            name={props.name}
            className="sr-only"
            value={choice.value}
            onBlur={props.onBlur}
            onChange={props.onChange}
            checked={props.value === choice.value}
          />
          <span>{choice.label}</span>
        </label>
      ))}
    </div>
  );
}
