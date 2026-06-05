import { Router } from "express";
import bcrypt from "bcryptjs";
import { db, usersTable, membersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";

const router = Router();

// GET /api/users/profile
router.get("/profile", authenticate, async (req: AuthRequest, res) => {
  const user = req.user!;
  const [member] = await db.select().from(membersTable).where(eq(membersTable.userId, user.id)).limit(1);
  res.json({
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    role: user.role,
    mfaEnabled: user.mfaEnabled,
    kycStatus: member?.kycStatus || "pending",
    createdAt: user.createdAt.toISOString(),
  });
});

// PATCH /api/users/profile
router.patch("/profile", authenticate, async (req: AuthRequest, res) => {
  const { firstName, lastName, phone } = req.body;
  const updates: Partial<typeof usersTable.$inferInsert> = {};
  if (firstName) updates.firstName = firstName;
  if (lastName) updates.lastName = lastName;
  if (phone) updates.phone = phone;
  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.id, req.user!.id)).returning();
  const [member] = await db.select().from(membersTable).where(eq(membersTable.userId, req.user!.id)).limit(1);
  res.json({
    id: updated.id,
    email: updated.email,
    firstName: updated.firstName,
    lastName: updated.lastName,
    phone: updated.phone,
    role: updated.role,
    mfaEnabled: updated.mfaEnabled,
    kycStatus: member?.kycStatus || "pending",
    createdAt: updated.createdAt.toISOString(),
  });
});

// POST /api/users/change-password
router.post("/change-password", authenticate, async (req: AuthRequest, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current and new password required" });
    return;
  }
  const valid = await bcrypt.compare(currentPassword, req.user!.passwordHash);
  if (!valid) {
    res.status(400).json({ error: "Current password incorrect" });
    return;
  }
  const passwordHash = await bcrypt.hash(newPassword, 12);
  await db.update(usersTable).set({ passwordHash }).where(eq(usersTable.id, req.user!.id));
  res.json({ message: "Password changed successfully" });
});

export default router;
