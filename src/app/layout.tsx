import { headers } from "next/headers";
import { Poppins } from "next/font/google";
import { cn } from "@/utils";
import AppLoader from "@/components/AppLoader";
import MaintenanceGate from "@/components/MaintenanceGate";
import ModerationGate from "@/components/ModerationGate";
import PageTransition from "@/components/PageTransition";
import SeoStructuredData from "@/components/SeoStructuredData";
import {
  SITE_DESCRIPTION,
  SITE_LOGO_PATH,
  SITE_NAME,
  SITE_OG_IMAGE_PATH,
  SITE_URL,
} from "@/lib/seo";

import type { Metadata } from "next";
import type { Viewport } from "next";

import "./globals.css";

const poppins = Poppins({
  subsets: ["latin", "latin-ext"],
  weight: ["400", "500"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headerList = await headers();
  const rawPath = headerList.get("x-canonical-path") ?? "/";
  const canonicalPath = rawPath.startsWith("/") ? rawPath : `/${rawPath}`;
  const canonicalUrl = new URL(canonicalPath, SITE_URL).toString();

  return {
    metadataBase: new URL(SITE_URL),
    title: {
      default: SITE_NAME,
      template: `%s | ${SITE_NAME}`,
    },
    icons: {
      icon: "/favicon.ico",
      shortcut: "/favicon.ico",
    },
    description: SITE_DESCRIPTION,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: "website",
      locale: "pl_PL",
      siteName: SITE_NAME,
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      url: canonicalUrl,
      images: [
        {
          url: SITE_OG_IMAGE_PATH,
          alt: `${SITE_NAME} - spolecznosc wedkarska`,
        },
        { url: SITE_LOGO_PATH, alt: `${SITE_NAME} logo` },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: SITE_NAME,
      description: SITE_DESCRIPTION,
      images: [SITE_OG_IMAGE_PATH, SITE_LOGO_PATH],
    },
  };
}
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl">
      <body
        suppressHydrationWarning
        className={cn(
          "w-screen h-full overflow-x-hidden antialiased",
          poppins.className
        )}
      >
        <SeoStructuredData />
        <AppLoader />
        <MaintenanceGate />
        <ModerationGate />
        <PageTransition>{children}</PageTransition>
      </body>
    </html>
  );
}

