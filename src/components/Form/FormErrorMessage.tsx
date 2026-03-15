interface FormErrorMessageProps {
  message: string;
  title?: string;
}

export default function FormErrorMessage({
  message,
  title,
}: FormErrorMessageProps) {
  const messageClassName = title ? "text-foreground-2" : "text-foreground";

  return (
    <div
      className="w-full px-[15px] py-[10px] flex items-center justify-center rounded-lg bg-red-600/10 border border-red-600"
      role="alert"
    >
      <div className="flex flex-col items-center gap-[2px] text-center">
        {title ? (
          <p className="text-[12px] font-semibold text-foreground">{title}</p>
        ) : null}
        <p className={`text-[12px] ${messageClassName}`}>{message}</p>
      </div>
    </div>
  );
}
