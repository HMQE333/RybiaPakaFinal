"use client";

import { createContext, useContext } from "react";

export type AdminViewer = {
  id: number;
  email: string;
  username: string | null;
  nick: string | null;
  role: string;
};

const AdminViewerContext = createContext<AdminViewer | null>(null);

export function AdminViewerProvider({
  viewer,
  children,
}: {
  viewer: AdminViewer;
  children: React.ReactNode;
}) {
  return (
    <AdminViewerContext.Provider value={viewer}>
      {children}
    </AdminViewerContext.Provider>
  );
}

export function useAdminViewer() {
  const viewer = useContext(AdminViewerContext);
  if (!viewer) {
    throw new Error("useAdminViewer must be used within AdminViewerProvider");
  }
  return viewer;
}

