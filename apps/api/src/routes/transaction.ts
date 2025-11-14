import { verifyTransaction } from "@/controllers/transactionController";
import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /transaction/verify:
 *   post:
 *     summary: Verify a reward contract transaction
 *     description: Verifies the provided transaction hash for a reward contract.
 *     tags:
 *       - Transaction
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studyId
 *               - transactionHash
 *             properties:
 *               studyId:
 *                 type: integer
 *                 description: ID of the study
 *                 example: 42
 *               transactionHash:
 *                 type: string
 *                 description: Transaction hash to verify
 *                 example: "0xabc123...def"
 *     responses:
 *       200:
 *         description: Transaction verification result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 verified:
 *                   type: boolean
 *                 reasons:
 *                   type: array
 *                   items:
 *                     type: string
 *       400:
 *         description: Bad request (missing or invalid inputs)
 *       401:
 *         description: Unauthorized - Invalid token
 *       404:
 *         description: Study not found
 *       500:
 *         description: Internal server error
 */

router.post("/verify", verifyTransaction);

export default router;
