import {
  getTransactionByWalletAddress,
  getTransactionsByStudyId,
  verifyTransaction,
} from "@/controllers/transactionController";
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

/**
 * @swagger
 * /transaction/{id}:
 *   get:
 *     summary: Get transactions by study ID
 *     description: Retrieves all transactions associated with a specific study ID.
 *     tags:
 *       - Transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the study
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       fromWallet:
 *                         type: string
 *                       toWallet:
 *                         type: string
 *                       value:
 *                         type: number
 *                       studyId:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Bad request (invalid study ID)
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/study/:id", getTransactionsByStudyId);

/**
 * @swagger
 * /transaction/user/{walletAddress}:
 *   get:
 *     summary: Get transactions by user wallet address
 *     description: Retrieves all transactions associated with a specific user wallet address.
 *     tags:
 *       - Transaction
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address of the user
 *     responses:
 *       200:
 *         description: List of transactions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       fromWallet:
 *                         type: string
 *                       toWallet:
 *                         type: string
 *                       valueUsd:
 *                         type: number
 *                       studyId:
 *                         type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *                       transactionHash:
 *                         type: string
 *       400:
 *         description: Bad request (invalid wallet address)
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/wallet/:walletAddress", getTransactionByWalletAddress);

export default router;
