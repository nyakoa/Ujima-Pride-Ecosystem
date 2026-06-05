import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import usersRouter from "./users";
import membersRouter from "./members";
import loansRouter from "./loans";
import documentsRouter from "./documents";
import aiRouter from "./ai";
import adminRouter from "./admin";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/users", usersRouter);
router.use("/members", membersRouter);
router.use(loansRouter);
router.use("/documents", documentsRouter);
router.use("/ai", aiRouter);
router.use("/admin", adminRouter);
router.use("/analytics", analyticsRouter);

export default router;
