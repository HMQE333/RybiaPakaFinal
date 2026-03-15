import { headers } from "next/headers";
import { redirect } from "next/navigation";

import AdminLayout from "@/app/admin/components/AdminLayout";
import { AdminAuthError, requireAdminFromHeaders } from "@/lib/adminAccess";

import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default async function AdminRootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const headerList = await headers();
  let viewer;
  try {
    viewer = await requireAdminFromHeaders(headerList as unknown as Headers);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      if (error.code === "UNAUTHORIZED") {
        redirect(`/logowanie?next=${encodeURIComponent("/administracja")}`);
      }
      redirect("/");
    }
    throw error;
  }

  return (
    <AdminLayout
      viewer={{
        id: viewer.id,
        email: viewer.email,
        username: viewer.username,
        nick: viewer.nick,
        role: viewer.role,
      }}
    >
      {children}
    </AdminLayout>
  );
}
