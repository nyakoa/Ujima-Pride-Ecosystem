import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useLogin } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginMode = "member" | "admin";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setAuth, user } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();
  const [mode, setMode] = useState<LoginMode>("member");

  if (user) {
    setLocation(user.role === "admin" ? "/admin/dashboard" : "/member/dashboard");
    return null;
  }

  const form = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    loginMutation.mutate({ data: values }, {
      onSuccess: (response) => {
        const isAdmin = response.user.role === "admin";
        if (mode === "admin" && !isAdmin) {
          toast({
            variant: "destructive",
            title: "Access Denied",
            description: "This account does not have admin privileges.",
          });
          return;
        }
        setAuth(response.accessToken, response.user);
        toast({
          title: isAdmin ? "Admin Portal Access Granted" : "Welcome back",
          description: isAdmin
            ? `Signed in as ${response.user.firstName} ${response.user.lastName} (Admin)`
            : "Welcome back to Ujima SACCO.",
        });
        setLocation(isAdmin ? "/admin/dashboard" : "/member/dashboard");
      },
      onError: (error: any) => {
        toast({
          variant: "destructive",
          title: "Login Failed",
          description: error?.message || "Invalid credentials. Please try again.",
        });
      }
    });
  };

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 font-bold text-2xl text-primary">
            <div className="w-10 h-10 bg-primary text-white rounded flex items-center justify-center font-serif">U</div>
            <span>Ujima SACCO</span>
          </Link>
        </div>

        {/* Mode toggle */}
        <div className="flex rounded-lg border bg-white p-1 mb-4 gap-1">
          <button
            type="button"
            onClick={() => setMode("member")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              mode === "member"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Users className="w-4 h-4" />
            Member Portal
          </button>
          <button
            type="button"
            onClick={() => setMode("admin")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-md text-sm font-medium transition-all ${
              mode === "admin"
                ? "bg-primary text-white shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Shield className="w-4 h-4" />
            Admin Portal
          </button>
        </div>

        <Card className="border shadow-lg">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl text-center flex items-center justify-center gap-2">
              {mode === "admin" && <Shield className="w-5 h-5 text-primary" />}
              {mode === "admin" ? "Admin Sign In" : "Member Sign In"}
            </CardTitle>
            <CardDescription className="text-center">
              {mode === "admin"
                ? "Access the Ujima SACCO administration panel"
                : "Sign in to manage your loans and applications"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {mode === "admin" && (
              <div className="mb-4 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-xs flex gap-2">
                <Shield className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
                <span>Admin access is restricted. Unauthorized sign-in attempts are logged.</span>
              </div>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email Address</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={mode === "admin" ? "admin@ujima.sacco" : "name@example.com"}
                          autoComplete="email"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Password</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" autoComplete="current-password" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  className="w-full"
                  disabled={loginMutation.isPending}
                >
                  {loginMutation.isPending
                    ? "Signing in..."
                    : mode === "admin"
                      ? "Sign In to Admin Portal"
                      : "Sign In"}
                </Button>
              </form>
            </Form>

            {mode === "member" && (
              <div className="mt-6 text-center text-sm text-muted-foreground">
                Don't have an account?{" "}
                <Link href="/register" className="text-primary hover:underline font-medium">
                  Join Us Today
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
