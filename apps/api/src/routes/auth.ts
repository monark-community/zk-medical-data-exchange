import { Router } from "express";
import { verifyAuthentication } from "@/controllers/authController";
import { verifyWeb3AuthToken } from "@/middleware/web3AuthMiddleware";

const router = Router();

/**
 * @swagger
 * /api/auth/verify:
 *   post:
 *     summary: Verify Web3Auth JWT token and create session
 *     description: Verifies the Web3Auth JWT token and creates a session token for the application
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authentication successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 sessionToken:
 *                   type: string
 *                 walletAddress:
 *                   type: string
 *                 email:
 *                   type: string
 *                 name:
 *                   type: string
 *       401:
 *         description: Unauthorized - Invalid token
 *       500:
 *         description: Internal server error
 */
router.post("/verify", verifyWeb3AuthToken, verifyAuthentication);

export default router;
