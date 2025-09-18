import { Router } from "express";
import medicalDataRoutes from "./medicalData";
import logger from '@/utils/logger';

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

router.use("/medical-data", medicalDataRoutes);

export default router;
