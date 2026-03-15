import { cn } from "@/utils";
import Link from "next/link";
import { Compass, Image as ImageIcon, User, LifeBuoy } from "lucide-react";

const quickLinks = [
  {
    title: "Forum",
    description: "Dołącz do dyskusji",
    icon: <Compass size={24} />,
    href: "/forum",
    color: "bg-blue-500/10 text-blue-500",
  },
  {
    title: "Galeria",
    description: "Zobacz zdjęcia",
    icon: <ImageIcon size={24} />,
    href: "/galeria",
    color: "bg-purple-500/10 text-purple-500",
  },
  {
    title: "Mój profil",
    description: "Zarządzaj kontem",
    icon: <User size={24} />,
    href: "/profil",
    color: "bg-green-500/10 text-green-500",
  },
  {
    title: "Zgłoś problem",
    description: "Pomoc techniczna",
    icon: <LifeBuoy size={24} />,
    href: "/zglos-problem",
    color: "bg-orange-500/10 text-orange-500",
  },
];

export default function QuickAccess() {
  return (
    <section className="w-full py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-[var(--foreground)]">
          Szybki dostęp
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickLinks.map((link, index) => (
            <Link
              key={index}
              href={link.href}
              className={cn(
                "p-6 rounded-xl border border-[var(--background-3)] bg-[var(--background-2)]",
                "hover:border-[var(--accent)]/50 hover:bg-[var(--background-3)] transition-all duration-300",
                "flex flex-col gap-4 group"
              )}
            >
              <div
                className={cn(
                  "w-12 h-12 rounded-lg flex items-center justify-center text-2xl",
                  link.color
                )}
              >
                {link.icon}
              </div>
              <div>
                <h3 className="font-semibold text-lg text-[var(--foreground)] group-hover:text-[var(--accent)] transition-colors">
                  {link.title}
                </h3>
                <p className="text-sm text-[var(--foreground-2)]">
                  {link.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
