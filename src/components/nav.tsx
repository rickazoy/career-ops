"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Search,
  Kanban,
  FileText,
  MessageSquare,
  User,
  Briefcase,
  Moon,
  Sun,
  LogOut,
  Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { useAuth } from "@/components/auth-provider";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/jobs", label: "Jobs", icon: Inbox },
  { href: "/evaluate", label: "Evaluate", icon: Search },
  { href: "/tracker", label: "Tracker", icon: Kanban },
  { href: "/resume", label: "Resume", icon: FileText },
  { href: "/interview", label: "Interview Prep", icon: MessageSquare },
  { href: "/scanner", label: "Scanner", icon: Briefcase },
  { href: "/profile", label: "Profile", icon: User },
];

export function Nav() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("career-ops-theme");
    const prefersDark = stored === "dark" || (!stored && window.matchMedia("(prefers-color-scheme: dark)").matches);
    setDark(prefersDark);
    document.documentElement.classList.toggle("dark", prefersDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("career-ops-theme", next ? "dark" : "light");
  }

  return (
    <nav className="fixed left-0 top-0 bottom-0 w-64 border-r border-border bg-sidebar flex flex-col z-50">
      <div className="p-6 pb-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
            <Briefcase className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight">Career Ops</h1>
            <p className="text-xs text-muted-foreground">AI Command Center</p>
          </div>
        </Link>
      </div>

      <div className="flex-1 px-3 space-y-1">
        {navItems.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
                active
                  ? "bg-sidebar-accent text-sidebar-primary"
                  : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
              )}
            >
              <item.icon className={cn("w-4.5 h-4.5", active && "text-sidebar-primary")} />
              {item.label}
            </Link>
          );
        })}
      </div>

      <div className="p-4 border-t border-sidebar-border space-y-1">
        {user && (
          <div className="px-3 py-2 mb-2">
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={toggleTheme}
          className="w-full justify-start gap-2 text-muted-foreground"
        >
          {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          {dark ? "Light Mode" : "Dark Mode"}
        </Button>
        {user && (
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="w-full justify-start gap-2 text-muted-foreground"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        )}
      </div>
    </nav>
  );
}
