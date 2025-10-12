import { Router } from "express";
import medicalDataRoutes from "./medicalData";
import studyRoutes from "./study";
import authRoutes from "./auth";
import userRoutes from "./user";
import auditRoutes from "./audit";
import logger from "@/utils/logger";
import { verifySessionToken } from "@/middleware/tokenValidationMiddleware";

const router = Router();

/**
 * @swagger
 * /:
 *   get:
 *     summary: Hello world endpoint
 *     responses:
 *       200:
 *         description: Hello world response
 */
router.get("/", (req, res) => {
  logger.info({ method: req.method, url: req.url }, "Root route accessed");
  res.send("Hello World!");
});

router.use("/auth", authRoutes);
router.use("/medical-data", verifySessionToken, medicalDataRoutes);
router.use("/studies", verifySessionToken, studyRoutes);
router.use("/users", verifySessionToken, userRoutes);
router.use("/audit", verifySessionToken, auditRoutes);

export default router;
