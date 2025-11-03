import { Router } from "express";
import { deleteFile, getPresignedIpfsUrl } from "@/controllers/ipfsController";

const router = Router();
/**
 * @swagger
 * /ipfs:
 *   get:
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
 *               resource_type:
 *                 type: string
 *     responses:
 *       201:
 *         description: Data created
 */
router.get("/", getPresignedIpfsUrl);

/**
 * @swagger
 * /ipfs:
 *   delete:
 *     summary: Delete medical data
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
 *     responses:
 *       200:
 *         description: Data deleted successfully
 */
router.delete("/", deleteFile);

export default router;
