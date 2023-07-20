import { ClassNameProps } from "../types/ClassNameProps";
import { Switch as HeadlessUISwitch } from "@headlessui/react";

type SwitchProps = ClassNameProps & {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
};

export default function Switch(props: SwitchProps) {
  return (
    <HeadlessUISwitch
      checked={props.enabled}
      onChange={props.setEnabled}
      className={`${props.enabled ? "bg-sky-400" : "bg-sky-600"}
          relative inline-flex h-[38px] w-[74px] shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus-visible:ring-2  focus-visible:ring-white focus-visible:ring-opacity-75`}
    >
      <span className="sr-only">Use setting</span>
      <span
        aria-hidden="true"
        className={`${props.enabled ? "translate-x-9" : "translate-x-0"}
            pointer-events-none inline-block h-[34px] w-[34px] transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out`}
      />
    </HeadlessUISwitch>
  );
}
