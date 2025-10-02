import { Router } from "express";
import {
  verifyAuthentication,
  refreshSession,
  logout,
  getCurrentUser,
} from "@/controllers/authController";
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
 *                 userId:
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

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh session token
 *     description: Refresh an existing session token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sessionToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Session refreshed successfully
 *       401:
 *         description: Invalid or expired session
 *       500:
 *         description: Internal server error
 */
router.post("/refresh", refreshSession);

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout the current user (client-side token removal)
 *     tags: [Authentication]
 *     responses:
 *       200:
 *         description: Logged out successfully
 */
router.post("/logout", logout);

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user
 *     description: Get the current authenticated user's information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User information retrieved successfully
 *       401:
 *         description: Unauthorized
 *       500:
 *         description: Internal server error
 */
router.get("/me", getCurrentUser);

export default router;
