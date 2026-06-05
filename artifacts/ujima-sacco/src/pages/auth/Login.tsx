import { useState, useRef } from "react";
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
import { Shield, Users, ArrowLeft, Loader2, KeyRound } from "lucide-react";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
});

type LoginMode = "member" | "admin";
type Step = "credentials" | "mfa";

export default function Login() {
  const [, setLocation] = useLocation();
  const { login: setAuth, user } = useAuth();
  const { toast } = useToast();
  const loginMutation = useLogin();

  const [mode, setMode] = useState<LoginMode>("member");
  const [step, setStep] = useState<Step>("credentials");
  const [sessionToken, setSessionToken] = useState<string>("");
  const [mfaCode, setMfaCode] = useState<string>("");
  const [mfaLoading, setMfaLoading] = useState(false);
  const pendingUserRef = useRef<any>(null);

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
      onSuccess: (response: any) => {
        if (response.requiresMfa) {
          pendingUserRef.current = response.user;
          setSessionToken(response.sessionToken);
          setStep("mfa");
          return;
        }
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
            ? `Signed in as ${response.user.firstName} ${response.user.lastName}`
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

  const onMfaSubmit = async () => {
    if (mfaCode.length !== 6) return;
    setMfaLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: mfaCode, sessionToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({
          variant: "destructive",
          title: "Invalid Code",
          description: data.error || "The authenticator code is incorrect or expired.",
        });
        setMfaCode("");
        return;
      }
      setAuth(data.accessToken, data.user);
      toast({
        title: "Admin Portal Access Granted",
        description: `Signed in as ${data.user.firstName} ${data.user.lastName}`,
      });
      setLocation("/admin/dashboard");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong. Please try again." });
    } finally {
      setMfaLoading(false);
    }
  };

  const resetToCredentials = () => {
    setStep("credentials");
    setMfaCode("");
    setSessionToken("");
    pendingUserRef.current = null;
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

        {step === "credentials" && (
          <>
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
                      {loginMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
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
          </>
        )}

        {step === "mfa" && (
          <Card className="border shadow-lg">
            <CardHeader className="space-y-1 text-center">
              <div className="flex justify-center mb-2">
                <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <KeyRound className="w-7 h-7 text-primary" />
                </div>
              </div>
              <CardTitle className="text-2xl">Two-Factor Verification</CardTitle>
              <CardDescription>
                Enter the 6-digit code from your authenticator app to complete sign-in.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <InputOTP
                  maxLength={6}
                  value={mfaCode}
                  onChange={setMfaCode}
                  onComplete={onMfaSubmit}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                  </InputOTPGroup>
                  <InputOTPSeparator />
                  <InputOTPGroup>
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>

                <p className="text-xs text-muted-foreground text-center">
                  Open your authenticator app (Google Authenticator, Authy, etc.) and enter the current code.
                </p>
              </div>

              <Button
                className="w-full"
                onClick={onMfaSubmit}
                disabled={mfaCode.length !== 6 || mfaLoading}
              >
                {mfaLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {mfaLoading ? "Verifying..." : "Verify & Sign In"}
              </Button>

              <button
                type="button"
                onClick={resetToCredentials}
                className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to sign in
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
