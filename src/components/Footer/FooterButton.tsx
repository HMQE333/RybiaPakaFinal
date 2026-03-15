import Link from "next/link";

interface FooterButtonProps {
  title: string;
  href: string;
  icon?: React.ReactNode;
}

export default function FooterButton({ title, href, icon }: FooterButtonProps) {
  return (
    <Link
      href={href}
      className="block py-2.5 text-[13px] text-gray-500 hover:underline lg:py-0"
    >
      {title}
    </Link>
  );
}
