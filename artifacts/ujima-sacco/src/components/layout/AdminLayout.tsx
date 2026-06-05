import { ReactNode, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { MfaSetupDialog } from "@/components/MfaSetupDialog";
import {
  LayoutDashboard,
  Files,
  CreditCard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  Shield,
  ShieldCheck,
  ChevronUp,
} from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mfaOpen, setMfaOpen] = useState(false);

  const links = [
    { href: "/admin/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/applications", label: "Loan Applications", icon: Files },
    { href: "/admin/loans", label: "Active Loans", icon: CreditCard },
    { href: "/admin/members", label: "Members", icon: Users },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { href: "/admin/users", label: "User Management", icon: Settings },
  ];

  return (
    <div className="min-h-[100dvh] flex bg-gray-50">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/admin/dashboard" className="flex items-center gap-3 font-bold text-xl">
            <div className="w-8 h-8 bg-sidebar-primary text-sidebar-primary-foreground rounded flex items-center justify-center font-serif">U</div>
            <span>Ujima Admin</span>
          </Link>
        </div>

        <nav className="flex-1 py-6 px-3 flex flex-col gap-1 overflow-y-auto">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = location === link.href || location.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors text-sm ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="w-4 h-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer: user info + MFA + logout */}
        <div className="p-4 border-t border-sidebar-border space-y-2">
          {/* MFA status + toggle */}
          <button
            onClick={() => setMfaOpen(true)}
            className={`flex items-center gap-2 px-3 py-2 w-full text-left rounded-md transition-colors text-xs ${
              user?.mfaEnabled
                ? "text-green-400 hover:bg-sidebar-accent/50"
                : "text-amber-400 hover:bg-sidebar-accent/50"
            }`}
          >
            {user?.mfaEnabled
              ? <ShieldCheck className="w-4 h-4 flex-shrink-0" />
              : <Shield className="w-4 h-4 flex-shrink-0" />}
            <span className="flex-1 truncate">
              {user?.mfaEnabled ? "MFA Enabled" : "Enable MFA"}
            </span>
            <ChevronUp className="w-3 h-3 opacity-50" />
          </button>

          {/* User chip */}
          {user && (
            <div className="px-3 py-2 rounded-md bg-sidebar-accent/30 flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-full bg-sidebar-primary text-sidebar-primary-foreground flex items-center justify-center text-xs font-bold flex-shrink-0">
                {user.firstName[0]}{user.lastName[0]}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-sidebar-foreground truncate">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-[10px] text-sidebar-foreground/60 truncate">{user.email}</p>
              </div>
            </div>
          )}

          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent/50 transition-colors text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 ml-64 flex flex-col min-h-screen">
        <div className="flex-1 p-8">
          {children}
        </div>
      </main>

      <MfaSetupDialog open={mfaOpen} onOpenChange={setMfaOpen} />
    </div>
  );
}
