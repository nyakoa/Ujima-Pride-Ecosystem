import { Router, Request, Response } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router = Router();

router.get("/healthz", (req: Request, res: Response): void => {
  try {
    const data = HealthCheckResponse.parse({ status: "ok" });
    res.json(data);
  } catch (error) {
    res.status(500).json({ status: "error" });
  }
  return; 
});

export default router;
