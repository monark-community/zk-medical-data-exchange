import { Router } from "express";
import medicalDataRoutes from "./medicalData";

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
  res.send("Hello World!");
});

router.use("/medical-data", medicalDataRoutes);

export default router;
