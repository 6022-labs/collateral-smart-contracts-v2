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
          className={`flex items-center justify-center cursor-pointer py-2 px-8 border-b border-t border-r border-black ${
            props.value === choice.value
              ? "bg-slate-300"
              : "bg-slate-200 hover:bg-slate-300"
          } ${index === 0 ? "rounded-l border-l" : ""} ${
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
          <span className="text-black">{choice.label}</span>
        </label>
      ))}
    </div>
  );
}
