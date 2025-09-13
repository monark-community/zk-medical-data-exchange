import { Router } from "express";
import { uploadData } from "../controllers/medicalDataController";

const router = Router();

/**
 * @swagger
 * /medical-data:
 *   post:
 *     summary: Upload new data
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *               dataType:
 *                 type: string
 *     responses:
 *       201:
 *         description: Data created
 */
router.post("/", uploadData);

export default router;
