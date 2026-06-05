import { useState } from "react";
import { Shield, Copy, Check, Loader2, KeyRound, AlertTriangle, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

type SetupStep = "intro" | "scan" | "verify" | "backup" | "disable-confirm";

interface MfaSetupData {
  qrCode: string;
  secret: string;
  backupCodes: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MfaSetupDialog({ open, onOpenChange }: Props) {
  const { user, token, login: setAuth } = useAuth();
  const { toast } = useToast();

  const [step, setStep] = useState<SetupStep>("intro");
  const [setupData, setSetupData] = useState<MfaSetupData | null>(null);
  const [otpCode, setOtpCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const isMfaEnabled = user?.mfaEnabled ?? false;

  const handleClose = () => {
    setStep("intro");
    setSetupData(null);
    setOtpCode("");
    setLoading(false);
    onOpenChange(false);
  };

  const startSetup = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/setup", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Setup failed");
      setSetupData(data);
      setStep("scan");
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message });
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Invalid Code", description: data.error || "Code is incorrect." });
        setOtpCode("");
        return;
      }
      if (user && token) setAuth(token, data.user);
      setStep("backup");
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  const disableMfa = async () => {
    if (otpCode.length !== 6) return;
    setLoading(true);
    try {
      const res = await fetch("/api/auth/mfa", {
        method: "DELETE",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ token: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast({ variant: "destructive", title: "Invalid Code", description: data.error || "Code is incorrect." });
        setOtpCode("");
        return;
      }
      if (user && token) setAuth(token, { ...user, mfaEnabled: false });
      toast({ title: "MFA Disabled", description: "Two-factor authentication has been turned off." });
      handleClose();
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Something went wrong." });
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    if (!setupData?.secret) return;
    navigator.clipboard.writeText(setupData.secret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        {/* INTRO / STATUS */}
        {step === "intro" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                Two-Factor Authentication
              </DialogTitle>
              <DialogDescription>
                {isMfaEnabled
                  ? "MFA is active on your account. Every sign-in requires your authenticator code."
                  : "Add an extra layer of security to your admin account."}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {isMfaEnabled ? (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-green-50 border border-green-200">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">MFA is enabled</p>
                    <p className="text-xs text-green-700 mt-0.5">Your account is protected with TOTP authentication.</p>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3 p-3 rounded-lg bg-amber-50 border border-amber-200">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-amber-800">MFA not enabled</p>
                    <p className="text-xs text-amber-700 mt-0.5">Enable MFA to protect your admin account from unauthorized access.</p>
                  </div>
                </div>
              )}

              <ul className="text-sm text-muted-foreground space-y-1.5">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  Works with Google Authenticator, Authy, or any TOTP app
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  Code refreshes every 30 seconds
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                  8 backup codes provided in case you lose your device
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-2">
              {isMfaEnabled ? (
                <>
                  <Button onClick={startSetup} disabled={loading} variant="outline">
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Regenerate QR Code &amp; Backup Codes
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => { setStep("disable-confirm"); setOtpCode(""); }}
                  >
                    <ShieldOff className="w-4 h-4 mr-2" />
                    Disable MFA
                  </Button>
                </>
              ) : (
                <Button onClick={startSetup} disabled={loading} className="w-full">
                  {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Set Up Two-Factor Authentication
                </Button>
              )}
            </div>
          </>
        )}

        {/* SCAN QR */}
        {step === "scan" && setupData && (
          <>
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Open your authenticator app and scan this QR code to add Ujima SACCO.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-2">
              <div className="border-2 border-border rounded-lg p-2 bg-white">
                <img src={setupData.qrCode} alt="MFA QR Code" className="w-48 h-48" />
              </div>
              <div className="w-full">
                <p className="text-xs text-muted-foreground mb-1 text-center">Can't scan? Enter this key manually:</p>
                <div className="flex items-center gap-2 p-2 bg-muted rounded-md">
                  <code className="flex-1 text-xs font-mono break-all text-center">{setupData.secret}</code>
                  <button type="button" onClick={copySecret} className="p-1 hover:text-primary transition-colors flex-shrink-0">
                    {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>

            <Button onClick={() => { setStep("verify"); setOtpCode(""); }} className="w-full">
              I've scanned the code →
            </Button>
          </>
        )}

        {/* VERIFY */}
        {step === "verify" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-primary" />
                Enter Verification Code
              </DialogTitle>
              <DialogDescription>
                Enter the 6-digit code shown in your authenticator app to confirm setup.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-4">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={confirmCode}
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
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("scan")} className="flex-1">Back</Button>
              <Button onClick={confirmCode} disabled={otpCode.length !== 6 || loading} className="flex-1">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? "Verifying..." : "Enable MFA"}
              </Button>
            </div>
          </>
        )}

        {/* BACKUP CODES */}
        {step === "backup" && setupData && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-700">
                <Shield className="w-5 h-5" />
                MFA Enabled!
              </DialogTitle>
              <DialogDescription>
                Save these backup codes somewhere safe. Each can only be used once if you lose your device.
              </DialogDescription>
            </DialogHeader>

            <div className="py-2">
              <div className="grid grid-cols-2 gap-2">
                {setupData.backupCodes.map((code) => (
                  <div key={code} className="font-mono text-sm bg-muted rounded px-3 py-1.5 text-center tracking-wider">
                    {code}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 border border-amber-200">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                These codes will not be shown again. Store them in a secure location like a password manager.
              </p>
            </div>

            <Button onClick={handleClose} className="w-full">
              I've saved my backup codes — Done
            </Button>
          </>
        )}

        {/* DISABLE MFA */}
        {step === "disable-confirm" && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-destructive">
                <ShieldOff className="w-5 h-5" />
                Disable Two-Factor Auth
              </DialogTitle>
              <DialogDescription>
                Enter your current authenticator code to confirm. This will remove MFA protection from your account.
              </DialogDescription>
            </DialogHeader>

            <div className="flex flex-col items-center gap-4 py-4">
              <InputOTP
                maxLength={6}
                value={otpCode}
                onChange={setOtpCode}
                onComplete={disableMfa}
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
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("intro")} className="flex-1">Cancel</Button>
              <Button
                variant="destructive"
                onClick={disableMfa}
                disabled={otpCode.length !== 6 || loading}
                className="flex-1"
              >
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                {loading ? "Disabling..." : "Disable MFA"}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
