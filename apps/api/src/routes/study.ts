import { Router } from "express";
import {
  createStudy,
  getStudies,
  getStudyById,
  getStudyCriteria,
  updateStudy,
  participateInStudy,
  deployStudy,
  deleteStudy,
} from "@/controllers/studyController";

const router = Router();

/**
 * @swagger
 * /studies:
 *   get:
 *     summary: Get list of studies
 *     parameters:
 *       - name: status
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by study status
 *       - name: template
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by template name
 *       - name: createdBy
 *         in: query
 *         schema:
 *           type: string
 *         description: Filter by creator wallet address
 *         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *         description: Items per page
 *     responses:
 *       200:
 *         description: List of studies
 */
router.get("/", getStudies);

/**
 * @swagger
 * /studies:
 *   post:
 *     summary: Create a new study
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               maxParticipants:
 *                 type: number
 *               durationDays:
 *                 type: number
 *               templateName:
 *                 type: string
 *               customCriteria:
 *                 type: object
 *               createdBy:
 *                 type: string
 *     responses:
 *       201:
 *         description: Study created successfully
 */
router.post("/", createStudy);

/**
 * @swagger
 * /studies/{id}:
 *   get:
 *     summary: Get study by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Study details
 *       404:
 *         description: Study not found
 */
router.get("/:id", getStudyById);

/**
 * @swagger
 * /studies/{id}/criteria:
 *   get:
 *     summary: Get study criteria by ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Study criteria
 *       404:
 *         description: Study not found
 */
router.get("/:id/criteria", getStudyCriteria);

/**
 * @swagger
 * /studies/{id}:
 *   put:
 *     summary: Update study (full update)
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               status:
 *                 type: string
 *               maxParticipants:
 *                 type: number
 *     responses:
 *       200:
 *         description: Study updated successfully
 *       404:
 *         description: Study not found
 */
router.put("/:id", updateStudy);

/**
 * @swagger
 * /studies/{id}:
 *   patch:
 *     summary: Partially update study
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *               contractAddress:
 *                 type: string
 *               deploymentTxHash:
 *                 type: string
 *     responses:
 *       200:
 *         description: Study updated successfully
 *       404:
 *         description: Study not found
 */
router.patch("/:id", updateStudy);

/**
 * @swagger
 * /studies/{id}/deployment:
 *   post:
 *     summary: Deploy study to blockchain
 *     description: Creates or updates the blockchain deployment for a study
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Study deployed successfully
 *       201:
 *         description: Study deployment created successfully
 *       400:
 *         description: Invalid request or deployment validation failed
 *       404:
 *         description: Study not found
 *       500:
 *         description: Deployment failed
 */
router.post("/:id/deployment", deployStudy);

/**
 * @swagger
 * /studies/{id}:
 *   delete:
 *     summary: Delete a study
 *     description: Delete a study from the database. Only draft or failed studies can be deleted.
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Study deleted successfully
 *       400:
 *         description: Cannot delete active study or invalid study ID
 *       404:
 *         description: Study not found
 *       500:
 *         description: Internal server error
 */
router.delete("/:id", deleteStudy);

/**
 * @swagger
 * /studies/{id}/participants:
 *   post:
 *     summary: Add a new participant to the study
 *     description: Register a new participant in the study with their eligibility proof
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *           minimum: 1
 *         description: Unique study identifier (must be 'active' status)
 *         example: 123
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - participantWallet
 *             properties:
 *               participantWallet:
 *                 type: string
 *                 description: Participant's wallet address
 *                 example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *                 pattern: "^0x[a-fA-F0-9]{40}$"
 *               proofJson:
 *                 type: object
 *                 description: Zero-knowledge proof of eligibility
 *               publicInputsJson:
 *                 type: object
 *                 description: Public inputs for proof verification
 *               matchedCriteria:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of criteria the participant matches
 *               eligibilityScore:
 *                 type: number
 *                 description: Numerical eligibility score
 *     responses:
 *       201:
 *         description: Participant added successfully
 *       400:
 *         description: Invalid participation data or proof verification failed
 *       404:
 *         description: Study not found
 *       409:
 *         description: Participant already enrolled in this study
 */
router.post("/:id/participants", participateInStudy);

export default router;
