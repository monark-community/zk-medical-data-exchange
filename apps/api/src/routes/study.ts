import { Router } from "express";
import {
  createStudy,
  getStudies,
  getStudyById,
  updateStudy,
  participateInStudy,
  deployStudy,
} from "../controllers/studyController";

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
 * /studies/{id}/deploy:
 *   post:
 *     summary: Deploy study to blockchain
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Study deployed successfully
 *       400:
 *         description: Invalid request or study already deployed
 *       404:
 *         description: Study not found
 *       500:
 *         description: Deployment failed
 */
router.post("/:id/deploy", deployStudy);

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
 * /studies/{id}:
 *   patch:
 *     summary: Update study
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
 * /studies/{id}/participate:
 *   post:
 *     summary: Participate in a study
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
 *               participantWallet:
 *                 type: string
 *               proofJson:
 *                 type: object
 *               publicInputsJson:
 *                 type: object
 *               matchedCriteria:
 *                 type: array
 *                 items:
 *                   type: string
 *               eligibilityScore:
 *                 type: number
 *     responses:
 *       201:
 *         description: Participation recorded successfully
 */
router.post("/:id/participate", participateInStudy);

export default router;
