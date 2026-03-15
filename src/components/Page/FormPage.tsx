import Link from "next/link";
import Footer from "../Footer";
import Header from "../Header";

import { LucideHome } from "lucide-react";

interface FormPageProps {
  header: boolean;
  children: React.ReactNode;
}

export default function FormPage({ header, children }: FormPageProps) {
  return (
    <div className="w-full min-h-[100svh] flex flex-col">
      {header && <Header />}

      <div className="w-full min-h-[100svh] flex items-center justify-center px-4">
        <div className="flex flex-col items-center justify-center px-[25px] py-[25px] gap-[10px] bg-background-3 rounded-2xl shadow-2xl">
          {children}
        </div>

        {!header && (
          <Link
            href="/"
            className="fixed top-[25px] right-[25px] flex items-center justify-center text-foreground-2 hover:text-foreground hover:cursor-pointer"
          >
            <LucideHome size={25} />
          </Link>
        )}
      </div>

      {header && <Footer />}
    </div>
  );
}
