import { useState, useRef, useEffect } from "react";
import { LucideChevronDown } from "lucide-react";

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface FormSelectorProps {
  id: string;
  placeholder: string;
  options: Option[];
  defaultValue?: string;
  value?: string;
  required?: boolean;
  onChange?: (value: string) => void;
}

export default function FormSelector({
  id,
  placeholder,
  options,
  defaultValue,
  value,
  required = true,
  onChange,
}: FormSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<Option | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (defaultValue) {
      const defaultOption =
        options.find((opt) => opt.value === defaultValue) || null;
      setSelectedOption(defaultOption);
      if (defaultOption) onChange?.(defaultOption.value);
    }
  }, [defaultValue, options, onChange]);

  useEffect(() => {
    if (value === undefined) return;

    if (!value) {
      setSelectedOption(null);
      onChange?.("");
      return;
    }

    const opt = options.find((o) => o.value === value) || null;
    setSelectedOption(opt);
    if (opt) {
      onChange?.(opt.value);
    }
  }, [value, options, onChange]);

  const handleSelect = (option: Option) => {
    setSelectedOption(option);
    setIsOpen(false);
    onChange?.(option.value);
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-[15px] py-2.5 text-[12px] text-foreground-2 bg-background border border-background-4 rounded-lg focus:outline-none focus:border-accent-2 group"
      >
        <span>{selectedOption ? selectedOption.label : placeholder}</span>
        <LucideChevronDown
          size={16}
          className={`text-foreground-2 transition-transform duration-200 ${isOpen ? "rotate-180" : ""} group-hover:text-accent`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 py-1 bg-background border border-background-4 rounded-lg shadow-lg max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-background-3 scrollbar-thumb-background-4 hover:scrollbar-thumb-accent/50">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleSelect(option)}
              className="w-full px-[15px] py-2 text-left text-[12px] hover:bg-background-3 hover:text-accent flex flex-col gap-0.5"
            >
              <span className="text-foreground">{option.label}</span>
              {option.description && (
                <span className="text-foreground-2">{option.description}</span>
              )}
            </button>
          ))}
        </div>
      )}

      {/* Hidden input for form validation */}
      <input
        type="hidden"
        id={id}
        name={id}
        value={selectedOption?.value || ""}
        required={required}
      />
    </div>
  );
}
