import { Router } from "express";
import path from "path";
import fs from "fs";
import { db, documentsTable } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { authenticate, type AuthRequest } from "../middlewares/auth";
import { logger } from "../lib/logger";

const router = Router();

const workspaceRoot = process.cwd().endsWith(path.join("artifacts", "api-server"))
  ? path.resolve(process.cwd(), "../..")
  : process.cwd();

const uploadsDir = path.resolve(workspaceRoot, "artifacts/api-server/uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

function formatDoc(doc: any) {
  return {
    id: doc.id,
    userId: doc.userId,
    applicationId: doc.applicationId,
    fileName: doc.fileName,
    fileType: doc.fileType,
    documentType: doc.documentType,
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
  };
}

// GET /api/documents
router.get("/", authenticate, async (req: AuthRequest, res) => {
  const docs = await db.select().from(documentsTable).where(eq(documentsTable.userId, req.user!.id));
  res.json(docs.map(formatDoc));
});

// POST /api/documents
router.post("/", authenticate, async (req: AuthRequest, res) => {
  const { fileName, fileType, documentType, applicationId, fileData } = req.body;
  if (!fileName || !documentType || !fileData) {
    res.status(400).json({ error: "fileName, documentType, and fileData are required" });
    return;
  }

  // Store base64 file to disk
  const safeFileName = `${Date.now()}_${req.user!.id}_${fileName.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const filePath = path.join(uploadsDir, safeFileName);
  const base64Data = fileData.replace(/^data:[^;]+;base64,/, "");
  fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));

  const [doc] = await db.insert(documentsTable).values({
    userId: req.user!.id,
    applicationId: applicationId || null,
    fileName,
    fileType: fileType || "application/octet-stream",
    documentType,
    filePath: safeFileName,
    status: "uploaded",
  }).returning();

  res.status(201).json(formatDoc(doc));
});

// DELETE /api/documents/:id
router.delete("/:id", authenticate, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const [doc] = await db.select().from(documentsTable)
    .where(and(eq(documentsTable.id, id), eq(documentsTable.userId, req.user!.id)))
    .limit(1);
  if (!doc) {
    res.status(404).json({ error: "Document not found" });
    return;
  }
  const filePath = path.join(uploadsDir, doc.filePath);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
  await db.delete(documentsTable).where(eq(documentsTable.id, id));
  res.json({ message: "Document deleted" });
});

export default router;
