import { getUserById } from "@/controllers/userController";
import { Router } from "express";

const router = Router();

/**
 * @swagger
 * /api/user/{walletAddress}:
 *   post:
 *     summary: Get user by wallet address
 *     description: Retrieves user information by wallet address
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id
 *                   type: string
 *                 username
 *                   type: string
 *                 createdAt
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
router.get("/:walletAddress", getUserById);

export default router;
