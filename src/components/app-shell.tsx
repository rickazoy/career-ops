"use client";

import { usePathname } from "next/navigation";
import { Nav } from "@/components/nav";
import { AuthProvider } from "@/components/auth-provider";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login";

  return (
    <AuthProvider>
      {isLogin ? (
        <>{children}</>
      ) : (
        <>
          <Nav />
          <main className="flex-1 ml-64 min-h-screen">{children}</main>
        </>
      )}
    </AuthProvider>
  );
}
