import { Router } from "express";
import { uploadCID } from "@/controllers/medicalDataController";

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
 *               wallet_address:
 *                 type: string
 *               encrypted_cid:
 *                 type: string
 *               record_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Data created
 */
router.post("/", uploadCID);

export default router;
