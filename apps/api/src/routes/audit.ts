import { Router } from "express";
import {
  getUserActionsByProfile,
  getUserActionsByProfilePaginated,
  getAuditRecord,
  getAllUserActions,
  getAuditInfo,
  logFileAccess,
} from "@/controllers/auditController";

const router = Router();

/**
 * @swagger
 * /audit/info:
 *   get:
 *     summary: Get audit system information
 *     description: Returns available user profiles and action types for reference
 *     responses:
 *       200:
 *         description: Audit system information
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     profiles:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           value:
 *                             type: number
 *                     actionTypes:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           name:
 *                             type: string
 *                           value:
 *                             type: number
 */
router.get("/info", getAuditInfo);

/**
 * @swagger
 * /audit/user/{userAddress}/actions:
 *   get:
 *     summary: Get all user actions across all profiles
 *     parameters:
 *       - name: userAddress
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: User's wallet address
 *         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of actions to return
 *     responses:
 *       200:
 *         description: User actions across all profiles
 *       400:
 *         description: Invalid user address or parameters
 *       500:
 *         description: Internal server error
 */
router.get("/user/:userAddress/actions", getAllUserActions);

/**
 * @swagger
 * /audit/user/{userAddress}/profile/{profile}/actions:
 *   get:
 *     summary: Get user actions for a specific profile (including COMMON actions)
 *     parameters:
 *       - name: userAddress
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: User's wallet address
 *         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *       - name: profile
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2, 3]
 *         description: User profile (0=RESEARCHER, 1=DATA_SELLER, 2=ADMIN, 3=COMMON)
 *         example: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of actions to return
 *     responses:
 *       200:
 *         description: User actions for the specified profile
 *       400:
 *         description: Invalid user address, profile, or parameters
 *       500:
 *         description: Internal server error
 */
router.get("/user/:userAddress/profile/:profile/actions", getUserActionsByProfile);

/**
 * @swagger
 * /audit/user/{userAddress}/profile/{profile}/actions/paginated:
 *   get:
 *     summary: Get paginated user actions for a specific profile (including COMMON actions)
 *     parameters:
 *       - name: userAddress
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: '^0x[a-fA-F0-9]{40}$'
 *         description: User's wallet address
 *         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *       - name: profile
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           enum: [0, 1, 2, 3]
 *         description: User profile (0=RESEARCHER, 1=DATA_SELLER, 2=ADMIN, 3=COMMON)
 *         example: 1
 *       - name: offset
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of records to skip
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 1000
 *           default: 100
 *         description: Maximum number of actions to return
 *       - name: latestFirst
 *         in: query
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Whether to return latest actions first
 *     responses:
 *       200:
 *         description: Paginated user actions for the specified profile
 *       400:
 *         description: Invalid user address, profile, or parameters
 *       500:
 *         description: Internal server error
 */
router.get(
  "/user/:userAddress/profile/:profile/actions/paginated",
  getUserActionsByProfilePaginated
);

/**
 * @swagger
 * /audit/log-access:
 *   post:
 *     summary: Log file access or download audit record
 *     description: Records when a user views or downloads a file
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userAddress
 *               - encryptedCID
 *               - accessType
 *             properties:
 *               userAddress:
 *                 type: string
 *                 pattern: '^0x[a-fA-F0-9]{40}$'
 *                 description: User's wallet address
 *                 example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *               encryptedCID:
 *                 type: string
 *                 description: Encrypted IPFS CID of the file
 *                 example: "encrypted_QmY7Yh4UquoXHLPFo2XbhXkhBvFoPwmQUSa92pxnxjQuPU"
 *               accessType:
 *                 type: string
 *                 enum: [view, download]
 *                 description: Type of file access
 *                 example: "view"
 *               resourceType:
 *                 type: string
 *                 description: Optional FHIR resource type of the accessed data
 *                 example: "Patient"
 *               success:
 *                 type: boolean
 *                 description: Whether the access was successful
 *                 default: true
 *               metadata:
 *                 type: object
 *                 description: Additional metadata about the access
 *                 properties:
 *                   fileSize:
 *                     type: number
 *                   mimeType:
 *                     type: string
 *                   userAgent:
 *                     type: string
 *     responses:
 *       200:
 *         description: File access logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     txHash:
 *                       type: string
 *                     message:
 *                       type: string
 *       400:
 *         description: Invalid request data
 *       500:
 *         description: Internal server error
 */
router.post("/log-access", logFileAccess);

/**
 * @swagger
 * /audit/record/{recordId}:
 *   get:
 *     summary: Get a specific audit record by ID
 *     parameters:
 *       - name: recordId
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: The audit record ID
 *         example: 123
 *     responses:
 *       200:
 *         description: Audit record details
 *       400:
 *         description: Invalid record ID
 *       404:
 *         description: Audit record not found
 *       500:
 *         description: Internal server error
 */
router.get("/record/:recordId", getAuditRecord);

export default router;
