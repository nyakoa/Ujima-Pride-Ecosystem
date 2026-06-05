import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  Files, 
  CheckSquare, 
  CreditCard, 
  Users, 
  BarChart3, 
  Settings,
  LogOut 
} from "lucide-react";

export function AdminLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const [location] = useLocation();

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
        <div className="p-4 border-t border-sidebar-border">
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
    </div>
  );
}
