import { Router } from "express";
import { downloadCIDs, uploadCID } from "@/controllers/medicalDataController";

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

/**
 * @swagger
 * /medical-data:
 *   get:
 *     summary: Get medical data by wallet address
 *     parameters:
 *       - in: query
 *         name: wallet_address
 *         schema:
 *           type: string
 *         required: true
 *         description: Wallet address of the user
 *     responses:
 *       200:
 *         description: Successful response with medical data
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   encrypted_cid:
 *                     type: string
 *                   resource_type:
 *                     type: string
 *                   created_at:
 *                     type: string
 *                     format: date-time
 */
router.get("/", downloadCIDs);

export default router;
