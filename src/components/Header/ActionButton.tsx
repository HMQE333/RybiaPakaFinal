import Link from "next/link";

interface ButtonProps {
  title: string;
  url: string;
  icon: React.ReactNode;
}

export default function ActionButton({ title, url, icon }: ButtonProps) {
  return (
    <Link
      href={url}
      aria-label={title}
      className="flex items-center justify-center gap-2 px-2 py-2 text-foreground-2 hover:text-accent border border-background-4 rounded-lg transition-colors sm:px-3 lg:gap-[15px] lg:px-4"
    >
      {icon}
      <p className="text-[12px] max-sm:hidden">{title}</p>
    </Link>
  );
}
