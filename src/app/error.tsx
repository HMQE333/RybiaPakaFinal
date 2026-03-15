"use client";

import Image from "next/image";
import Link from "next/link";

import { LucideUndo2 } from "lucide-react";
import { useEffect } from "react";
import Page from "@/components/Page";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <Page>
      <div className="w-screen h-screen flex flex-col gap-[15px] items-center justify-center">
        <Image src="/error.png" width={450} height={10} alt="404" />

        <button
          onClick={() => reset()}
          className="flex items-center justify-center gap-[15px] px-[30px] py-[15px] rounded-[10px] bg-foreground hover:bg-accent-2 text-black hover:text-foreground"
        >
          <LucideUndo2 />
          <p>Spróbuj ponownie</p>
        </button>

        <div className="flex items-center gap-4 text-[12px] text-foreground-2">
          <Link href="/" className="hover:text-foreground hover:underline">
            Wróć na stronę główną
          </Link>
          <Link href="/kontakt" className="hover:text-foreground hover:underline">
            Kontakt
          </Link>
        </div>
      </div>
    </Page>
  );
}
