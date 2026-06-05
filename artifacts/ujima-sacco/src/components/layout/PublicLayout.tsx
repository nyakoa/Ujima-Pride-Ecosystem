import { ReactNode } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut, LayoutDashboard } from "lucide-react";

export function PublicLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  const getDashboardLink = () => {
    if (!user) return "/";
    return user.role === "admin" ? "/admin/dashboard" : "/member/dashboard";
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="border-b bg-white sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href={getDashboardLink()} className="flex items-center gap-2 font-bold text-xl text-primary">
            <div className="w-8 h-8 bg-primary text-white rounded flex items-center justify-center font-serif">U</div>
            <span>Ujima SACCO</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/" className="hover:text-primary transition-colors">Home</Link>
            <Link href="/about" className="hover:text-primary transition-colors">About Us</Link>
            <Link href="/loan-products" className="hover:text-primary transition-colors">Loan Products</Link>
            <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <>
                <Link href={getDashboardLink()} className="text-sm font-medium hover:text-primary transition-colors hidden md:block">
                  Dashboard
                </Link>
                <Button variant="outline" size="sm" onClick={() => logout()}>
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-primary transition-colors">
                  Login
                </Link>
                <Button asChild size="sm">
                  <Link href="/register">Join Us</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>
      <main className="flex-1 flex flex-col">
        {children}
      </main>
      <footer className="border-t bg-muted/30 py-8">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Ujima SACCO AI Pride Ecosystem. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
