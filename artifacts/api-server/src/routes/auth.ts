import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import speakeasy from "speakeasy";
import qrcode from "qrcode";
import { db, usersTable, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, generateTokens, JWT_SECRET, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

function formatUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    firstName: u.firstName,
    lastName: u.lastName,
    phone: u.phone,
    role: u.role,
    isActive: u.isActive,
    mfaEnabled: u.mfaEnabled,
    createdAt: u.createdAt.toISOString(),
  };
}

// POST /api/auth/register
router.post("/register", async (req, res) => {
  const { firstName, lastName, email, password, phone, idNumber } = req.body;
  if (!firstName || !lastName || !email || !password) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }
  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (existing) {
    res.status(400).json({ error: "Email already registered" });
    return;
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const [user] = await db.insert(usersTable).values({
    email, passwordHash, firstName, lastName, phone, idNumber, role: "applicant",
  }).returning();
  // Create empty member profile
  await db.insert(membersTable).values({ userId: user.id });
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  await db.update(usersTable).set({ refreshToken }).where(eq(usersTable.id, user.id));
  res.status(201).json({ accessToken, refreshToken, user: formatUser(user) });
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  const { email, password, mfaToken } = req.body;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }
  if (!user.isActive) {
    res.status(401).json({ error: "Account deactivated" });
    return;
  }
  // MFA check for admins
  if (user.mfaEnabled && user.mfaSecret) {
    if (!mfaToken) {
      // Return a session token for MFA step
      const sessionToken = jwt.sign({ userId: user.id, step: "mfa" }, JWT_SECRET, { expiresIn: "5m" });
      res.json({ requiresMfa: true, sessionToken, accessToken: "", user: formatUser(user) });
      return;
    }
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token: mfaToken,
      window: 2,
    });
    if (!verified) {
      res.status(401).json({ error: "Invalid MFA token" });
      return;
    }
  }
  const { accessToken, refreshToken } = generateTokens(user.id, user.role);
  await db.update(usersTable).set({ refreshToken }).where(eq(usersTable.id, user.id));
  res.json({ accessToken, refreshToken, user: formatUser(user) });
});

// POST /api/auth/logout
router.post("/logout", authenticate, async (req: AuthRequest, res) => {
  if (req.userId) {
    await db.update(usersTable).set({ refreshToken: null }).where(eq(usersTable.id, req.userId));
  }
  res.json({ message: "Logged out successfully" });
});

// GET /api/auth/me
router.get("/me", authenticate, async (req: AuthRequest, res) => {
  res.json(formatUser(req.user!));
});

// POST /api/auth/refresh
router.post("/refresh", async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    res.status(400).json({ error: "Refresh token required" });
    return;
  }
  try {
    const payload = jwt.verify(refreshToken, JWT_SECRET) as { userId: number; role: string };
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (!user || user.refreshToken !== refreshToken) {
      res.status(401).json({ error: "Invalid refresh token" });
      return;
    }
    const tokens = generateTokens(user.id, user.role);
    await db.update(usersTable).set({ refreshToken: tokens.refreshToken }).where(eq(usersTable.id, user.id));
    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: formatUser(user) });
  } catch {
    res.status(401).json({ error: "Invalid refresh token" });
  }
});

// POST /api/auth/password-reset-request
router.post("/password-reset-request", async (req, res) => {
  const { email } = req.body;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);
  // Always return success to prevent user enumeration
  if (user) {
    const token = jwt.sign({ userId: user.id, type: "reset" }, JWT_SECRET, { expiresIn: "1h" });
    const expiry = new Date(Date.now() + 3600000);
    await db.update(usersTable).set({ passwordResetToken: token, passwordResetExpiry: expiry }).where(eq(usersTable.id, user.id));
    logger.info({ email }, "Password reset requested (token stored, email mocked)");
  }
  res.json({ message: "If this email exists, a reset link has been sent" });
});

// POST /api/auth/password-reset
router.post("/password-reset", async (req, res) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    res.status(400).json({ error: "Token and new password required" });
    return;
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { userId: number; type: string };
    if (payload.type !== "reset") throw new Error("wrong type");
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (!user || user.passwordResetToken !== token) {
      res.status(400).json({ error: "Invalid or expired reset token" });
      return;
    }
    if (user.passwordResetExpiry && user.passwordResetExpiry < new Date()) {
      res.status(400).json({ error: "Reset token expired" });
      return;
    }
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(usersTable).set({ passwordHash, passwordResetToken: null, passwordResetExpiry: null }).where(eq(usersTable.id, user.id));
    res.json({ message: "Password reset successfully" });
  } catch {
    res.status(400).json({ error: "Invalid reset token" });
  }
});

// POST /api/auth/mfa/setup
router.post("/mfa/setup", authenticate, async (req: AuthRequest, res) => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ error: "MFA setup is for admin accounts only" });
    return;
  }
  const secret = speakeasy.generateSecret({ name: `UjimaSACCO:${req.user.email}`, length: 20 });
  const qrCode = await qrcode.toDataURL(secret.otpauth_url || "");
  const backupCodes = Array.from({ length: 8 }, () => Math.random().toString(36).slice(2, 10).toUpperCase());
  await db.update(usersTable).set({
    mfaSecret: secret.base32,
    mfaBackupCodes: JSON.stringify(backupCodes),
  }).where(eq(usersTable.id, req.user.id));
  res.json({ secret: secret.base32, qrCode, backupCodes });
});

// POST /api/auth/mfa/verify
router.post("/mfa/verify", async (req, res) => {
  const { token, sessionToken } = req.body;
  if (!token || !sessionToken) {
    res.status(400).json({ error: "Token and session token required" });
    return;
  }
  try {
    const payload = jwt.verify(sessionToken, JWT_SECRET) as { userId: number; step: string };
    if (payload.step !== "mfa") throw new Error("wrong step");
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId)).limit(1);
    if (!user || !user.mfaSecret) {
      res.status(400).json({ error: "MFA not configured" });
      return;
    }
    const verified = speakeasy.totp.verify({
      secret: user.mfaSecret,
      encoding: "base32",
      token,
      window: 2,
    });
    if (!verified) {
      res.status(401).json({ error: "Invalid MFA token" });
      return;
    }
    if (!user.mfaEnabled) {
      await db.update(usersTable).set({ mfaEnabled: true }).where(eq(usersTable.id, user.id));
    }
    const tokens = generateTokens(user.id, user.role);
    await db.update(usersTable).set({ refreshToken: tokens.refreshToken }).where(eq(usersTable.id, user.id));
    res.json({ accessToken: tokens.accessToken, refreshToken: tokens.refreshToken, user: formatUser(user) });
  } catch {
    res.status(401).json({ error: "Invalid session token" });
  }
});

export default router;
