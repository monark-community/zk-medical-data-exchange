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
  getEnrolledStudies,
  revokeStudyConsent,
  grantStudyConsent,
  generateDataCommitmentChallenge,
  fetchParticipantsBlockchain,
  logStudyDataAccess,
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
 * /studies/enrolled/{walletAddress}:
 *   get:
 *     summary: Get all studies a user is enrolled in
 *     description: Retrieves all studies where the user is an enrolled participant
 *     parameters:
 *       - name: walletAddress
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           pattern: "^0x[a-fA-F0-9]{40}$"
 *         description: Participant's wallet address
 *         example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *     responses:
 *       200:
 *         description: List of enrolled studies
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 studies:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Internal server error
 */
router.get("/enrolled/:walletAddress", getEnrolledStudies);

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
 * /studies/participants/{id}:
 *   get:
 *     summary: Get study participants from the blockchain by study ID
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Study participants from blockchain
 *       404:
 *         description: Study not found
 */
router.get("/:id/participants", fetchParticipantsBlockchain);

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
 * /studies/data-commitment:
 *   post:
 *     summary: Generate challenge for data commitment
 *     description: Generate a cryptographic challenge for verifying data commitment before study participation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studyId
 *               - participantWallet
 *               - dataCommitment
 *             properties:
 *               studyId:
 *                 type: number
 *                 description: ID of the study to participate in
 *                 example: 123
 *               participantWallet:
 *                 type: string
 *                 description: Participant's wallet address
 *                 example: "0x742d35Cc6635C0532925a3b8D97C6b009af2af9f"
 *                 pattern: "^0x[a-fA-F0-9]{40}$"
 *               dataCommitment:
 *                 type: string
 *                 description: Hash commitment of the participant's medical data
 *     responses:
 *       200:
 *         description: Challenge generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 challenge:
 *                   type: string
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request or study not accepting participants
 *       404:
 *         description: Study not found
 *       500:
 *         description: Internal server error
 */
router.post("/data-commitment", generateDataCommitmentChallenge);

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

/**
 * @swagger
 * /studies/{id}/consent/revoke:
 *   post:
 *     summary: Revoke consent for study participation
 *     description: Allows a participant to revoke their consent for data usage in a study
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study ID
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
 *                 pattern: "^0x[a-fA-F0-9]{40}$"
 *                 description: Participant's wallet address
 *     responses:
 *       200:
 *         description: Consent revoked successfully
 *       400:
 *         description: Invalid request or consent already revoked
 *       404:
 *         description: Participation not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/consent/revoke", revokeStudyConsent);

/**
 * @swagger
 * /studies/{id}/consent/grant:
 *   post:
 *     summary: Grant consent for study participation
 *     description: Allows a participant to grant their consent for data usage in a study after previously revoking
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study ID
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
 *                 pattern: "^0x[a-fA-F0-9]{40}$"
 *                 description: Participant's wallet address
 *     responses:
 *       200:
 *         description: Consent granted successfully
 *       400:
 *         description: Invalid request or consent already active
 *       404:
 *         description: Participation not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/consent/grant", grantStudyConsent);

/**
 * @swagger
 * /studies/{id}/data-access:
 *   post:
 *     summary: Log study data access by creator
 *     description: Logs when a study creator accesses aggregated participant data, creating audit trail entries for both creator and participants
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - creatorWallet
 *             properties:
 *               creatorWallet:
 *                 type: string
 *                 pattern: "^0x[a-fA-F0-9]{40}$"
 *                 description: Study creator's wallet address
 *     responses:
 *       200:
 *         description: Data access logged successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 studyId:
 *                   type: integer
 *                 participantCount:
 *                   type: integer
 *                 creatorTxHash:
 *                   type: string
 *                 participantsTxHash:
 *                   type: string
 *       400:
 *         description: Invalid request or no consented participants
 *       403:
 *         description: Unauthorized - only study creator can log data access
 *       404:
 *         description: Study not found
 *       500:
 *         description: Internal server error
 */
router.post("/:id/data-access", logStudyDataAccess);

export default router;
