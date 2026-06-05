import { ReactNode } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { 
  LayoutDashboard, 
  FileText, 
  Files, 
  CreditCard, 
  User, 
  LogOut 
} from "lucide-react";

export function MemberLayout({ children }: { children: ReactNode }) {
  const { logout } = useAuth();
  const [location] = useLocation();

  const links = [
    { href: "/member/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/member/apply", label: "Apply for Loan", icon: FileText },
    { href: "/member/applications", label: "My Applications", icon: Files },
    { href: "/member/loans", label: "Active Loans", icon: CreditCard },
    { href: "/member/profile", label: "Profile", icon: User },
  ];

  return (
    <div className="min-h-[100dvh] flex bg-gray-50">
      <aside className="w-64 bg-sidebar text-sidebar-foreground flex-shrink-0 flex flex-col fixed inset-y-0 left-0 z-10">
        <div className="p-6 border-b border-sidebar-border">
          <Link href="/member/dashboard" className="flex items-center gap-3 font-bold text-xl">
            <div className="w-8 h-8 bg-sidebar-primary text-sidebar-primary-foreground rounded flex items-center justify-center font-serif">U</div>
            <span>Ujima SACCO</span>
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
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors ${
                  isActive 
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium border-l-2 border-sidebar-primary" 
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-sidebar-border">
          <button 
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 w-full text-left rounded-md text-sidebar-foreground/80 hover:bg-sidebar-accent/50 transition-colors"
          >
            <LogOut className="w-5 h-5" />
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
