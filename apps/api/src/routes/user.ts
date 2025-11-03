import { getUserById, updateUser } from "@/controllers/userController";
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

export default router;
