import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /test:
 *   get:
 *     summary: Get test
 *     responses:
 *       200:
 *         description: Test response
 */
router.get("/test", (req, res) => {
  res.json({ message: "Test!!" });
});

export default router;
