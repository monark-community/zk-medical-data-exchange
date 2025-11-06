import { getUserById, updateUser } from "@/controllers/userController";
import { getUserParticipations } from "@/controllers/studyController";
import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /api/user/{walletAddress}:
 *   get:
 *     summary: Get user by wallet address
 *     description: Retrieves user information by wallet address
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: The wallet address of the user
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */

router.get("/:walletAddress", getUserById);

/**
 * @swagger
 * /api/user/{walletAddress}:
 *   patch:
 *     summary: Update user information
 *     description: Updates user information by wallet address
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: The wallet address of the user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *                 pattern: '^[a-zA-Z_]{4,10}$'
 *                 description: Username must be 4-10 characters, letters and underscores only
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 username:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *       400:
 *         description: Bad request - Invalid data
 *       404:
 *         description: User not found
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
router.patch("/:walletAddress", updateUser);

/**
 * @swagger
 * /api/user/{wallet}/participations:
 *   get:
 *     summary: Get all studies a user has participated in
 *     description: Returns all study participations for a given wallet address
 *     tags: [User]
 *     parameters:
 *       - in: path
 *         name: wallet
 *         required: true
 *         schema:
 *           type: string
 *         description: Wallet address (0x...)
 *         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, verified, rejected]
 *         description: Filter by participation status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of results per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *     responses:
 *       200:
 *         description: List of user participations
 *       400:
 *         description: Invalid wallet address
 */
router.get("/:wallet/participations", getUserParticipations);

export default router;

