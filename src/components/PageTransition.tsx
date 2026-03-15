"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";

type PageTransitionProps = {
  children: React.ReactNode;
};

function normalizePathname(pathname: string) {
  let decoded = pathname;
  try {
    decoded = decodeURI(pathname);
  } catch {
    decoded = pathname;
  }
  if (decoded.startsWith("/admin")) {
    return decoded.replace(/^\/admin/, "/administracja");
  }
  return decoded;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const rawPathname = usePathname() || "/";
  const normalizedPathname = useMemo(
    () => normalizePathname(rawPathname),
    [rawPathname]
  );
  const [transitionKey, setTransitionKey] = useState("page");

  useEffect(() => {
    setTransitionKey(normalizedPathname);
  }, [normalizedPathname]);

  return (
    <div key={transitionKey} className="page-transition">
      {children}
    </div>
  );
}
