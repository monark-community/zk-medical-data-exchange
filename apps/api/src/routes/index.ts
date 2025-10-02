import { Router } from "express";
import medicalDataRoutes from "./medicalData";
import studyRoutes from "./study";
import authRoutes from "./auth";
import logger from "@/utils/logger";

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
router.use("/medical-data", medicalDataRoutes);
router.use("/studies", studyRoutes);

export default router;
