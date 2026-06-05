import { Switch, Route, Router as WouterRouter, Redirect } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute, AdminRoute } from "@/components/ProtectedRoute";

// Public pages
import Home from "@/pages/public/Home";
import About from "@/pages/public/About";
import LoanProducts from "@/pages/public/LoanProducts";
import Contact from "@/pages/public/Contact";

// Auth pages
import Login from "@/pages/auth/Login";
import Register from "@/pages/auth/Register";

// Member pages
import MemberDashboard from "@/pages/member/Dashboard";
import Applications from "@/pages/member/Applications";
import ApplicationDetail from "@/pages/member/ApplicationDetail";
import ActiveLoans from "@/pages/member/ActiveLoans";
import Profile from "@/pages/member/Profile";
import ApplyLoan from "@/pages/member/ApplyLoan";

// Admin pages
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminLoanApplications from "@/pages/admin/LoanApplications";
import ApplicationReview from "@/pages/admin/ApplicationReview";
import AdminActiveLoans from "@/pages/admin/ActiveLoans";
import AdminMembers from "@/pages/admin/Members";
import Analytics from "@/pages/admin/Analytics";
import UserManagement from "@/pages/admin/UserManagement";

import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
    },
  },
});

function Router() {
  return (
    <Switch>
      {/* Public routes */}
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/loan-products" component={LoanProducts} />
      <Route path="/contact" component={Contact} />

      {/* Auth routes */}
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />

      {/* Member routes */}
      <Route path="/member/dashboard">
        <ProtectedRoute><MemberDashboard /></ProtectedRoute>
      </Route>
      <Route path="/member/apply">
        <ProtectedRoute><ApplyLoan /></ProtectedRoute>
      </Route>
      <Route path="/member/applications/:id">
        <ProtectedRoute><ApplicationDetail /></ProtectedRoute>
      </Route>
      <Route path="/member/applications">
        <ProtectedRoute><Applications /></ProtectedRoute>
      </Route>
      <Route path="/member/loans">
        <ProtectedRoute><ActiveLoans /></ProtectedRoute>
      </Route>
      <Route path="/member/profile">
        <ProtectedRoute><Profile /></ProtectedRoute>
      </Route>

      {/* Admin routes */}
      <Route path="/admin/dashboard">
        <AdminRoute><AdminDashboard /></AdminRoute>
      </Route>
      <Route path="/admin/applications/:id">
        <AdminRoute><ApplicationReview /></AdminRoute>
      </Route>
      <Route path="/admin/applications">
        <AdminRoute><AdminLoanApplications /></AdminRoute>
      </Route>
      <Route path="/admin/loans">
        <AdminRoute><AdminActiveLoans /></AdminRoute>
      </Route>
      <Route path="/admin/members">
        <AdminRoute><AdminMembers /></AdminRoute>
      </Route>
      <Route path="/admin/analytics">
        <AdminRoute><Analytics /></AdminRoute>
      </Route>
      <Route path="/admin/users">
        <AdminRoute><UserManagement /></AdminRoute>
      </Route>

      {/* Redirects */}
      <Route path="/member">
        <Redirect to="/member/dashboard" />
      </Route>
      <Route path="/admin">
        <Redirect to="/admin/dashboard" />
      </Route>

      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <AuthProvider>
            <Router />
          </AuthProvider>
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
