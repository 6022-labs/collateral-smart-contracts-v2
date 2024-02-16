export type InputProps = {
  value: any;
  name: string;
  required?: boolean;
  disabled?: boolean;
  onBlur?: () => void;
  onChange: (value: any) => void;
};
