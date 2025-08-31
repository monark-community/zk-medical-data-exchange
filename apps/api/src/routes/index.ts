import { Router } from "express";
import testRoutes from "./test";

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

router.use("/test", testRoutes);

export default router;
