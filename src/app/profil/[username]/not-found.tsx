import Image from "next/image";
import Link from "next/link";
import Page from "@/components/Page";

import { LucideHome } from "lucide-react";

export default function NotFound() {
  return (
    <Page>
      <div className="w-screen h-screen flex flex-col gap-[15px] items-center justify-center">
        <Image src="/artwork/404_user.png" width={450} height={10} alt="404" />

        <Link
          href="/"
          className="flex items-center justify-center gap-[15px] px-[30px] py-[15px] rounded-[10px] bg-foreground hover:bg-accent-2 text-black hover:text-foreground"
        >
          <LucideHome />
          <p>Wróć na Stronę Główną</p>
        </Link>
      </div>
    </Page>
  );
}
