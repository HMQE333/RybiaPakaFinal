interface FormInputProps {
  id: string;
  type: string;
  placeholder: string;
  defaultValue?: string;
  pattern?: string;
  title?: string;
  multiple?: boolean;
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  ariaLabel?: string;
}

export default function FormInput({
  id,
  type,
  placeholder,
  defaultValue,
  pattern,
  title,
  multiple,
  required = true,
  minLength,
  maxLength,
  ariaLabel,
}: FormInputProps) {
  return (
    <input
      id={id}
      name={id}
      type={type}
      placeholder={placeholder}
      defaultValue={defaultValue}
      pattern={pattern}
      title={title}
      required={required}
      multiple={multiple}
      minLength={minLength}
      maxLength={maxLength}
      aria-label={ariaLabel ?? placeholder}
      className="w-full px-[15px] py-[10px] text-[12px] text-foreground-2 bg-background border border-background-4 rounded-lg focus:outline-none focus:border-accent-2 focus:ring-0"
    />
  );
}
