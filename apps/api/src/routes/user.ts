import {
  getPlatformUserCount,
  getUserById,
  getUserStats,
  updateUser,
} from "@/controllers/userController";
import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /user/count:
 *   get:
 *     summary: Get total number of users on platform
 *     description: Retrieves the total count of registered users on the platform
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User count retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: number
 *                   description: Total number of users
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/count", getPlatformUserCount);

/**
 * @swagger
 * /user/stats/{walletAddress}/{profile}:
 *   get:
 *     summary: Get user statistics
 *     description: Retrieves statistics for a user based on wallet address and profile type
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: walletAddress
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: Ethereum wallet address (0x...)
 *       - in: path
 *         name: profile
 *         required: true
 *         schema:
 *           type: string
 *           enum: [DATA_SELLER, RESEARCHER]
 *         description: User profile type
 *     responses:
 *       200:
 *         description: User statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 nActiveStudies:
 *                   type: number
 *                 nCompletedStudies:
 *                   type: number
 *                 nMedicalFiles:
 *                   type: number
 *                 totalEarnings:
 *                   type: number
 *       400:
 *         description: Bad request - Invalid wallet address or profile
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/stats/:walletAddress/:profile", getUserStats);

/**
 * @swagger
 * /user/{walletAddress}:
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
 * /user/{walletAddress}:
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
