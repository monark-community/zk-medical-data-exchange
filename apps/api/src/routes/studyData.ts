import { Router } from 'express';
import {
  uploadStudyData,
  getStudyPublicKeyEndpoint,
  checkParticipantDataStatus,
  triggerDataAggregation,
  getAggregatedData,
  getAccessLogs,
} from '../controllers/studyDataController.js';

const router = Router();

/**
 * @swagger
 * /studies/{id}/upload-data:
 *   post:
 *     summary: Upload encrypted medical data to a study
 *     description: Allows enrolled participants to submit their encrypted medical data to an active study
 *     tags:
 *       - Study Data
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - participantAddress
 *               - encryptedData
 *               - encryptionMetadata
 *               - dataHash
 *             properties:
 *               participantAddress:
 *                 type: string
 *                 description: Ethereum address of the participant
 *                 example: "0x742d35Cc6635C0532925a3b844D97C6b009af2af9f"
 *               encryptedData:
 *                 type: string
 *                 description: Base64-encoded AES-encrypted medical data
 *               encryptionMetadata:
 *                 type: object
 *                 properties:
 *                   encryptedKey:
 *                     type: string
 *                     description: Base64-encoded RSA-encrypted AES key
 *                   iv:
 *                     type: string
 *                     description: Base64-encoded initialization vector
 *                   authTag:
 *                     type: string
 *                     description: Base64-encoded authentication tag
 *               dataHash:
 *                 type: string
 *                 description: SHA-256 hash of encrypted data for integrity verification
 *               ipfsHash:
 *                 type: string
 *                 description: Optional IPFS hash if data is also stored on IPFS
 *     responses:
 *       201:
 *         description: Data uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 uploadId:
 *                   type: integer
 *                 message:
 *                   type: string
 *                 studyId:
 *                   type: integer
 *                 participantAddress:
 *                   type: string
 *       400:
 *         description: Invalid request or study not accepting data
 *       403:
 *         description: Participant not enrolled in study
 *       404:
 *         description: Study not found
 *       409:
 *         description: Data already uploaded
 *       500:
 *         description: Internal server error
 */
router.post('/:id/upload-data', uploadStudyData);

/**
 * @swagger
 * /studies/{id}/public-key:
 *   get:
 *     summary: Get study's public encryption key
 *     description: Retrieve the RSA public key for encrypting medical data before upload
 *     tags:
 *       - Study Data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study ID
 *     responses:
 *       200:
 *         description: Public key retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 studyId:
 *                   type: integer
 *                 studyTitle:
 *                   type: string
 *                 publicKey:
 *                   type: string
 *                   description: RSA public key in PEM format
 *                 algorithm:
 *                   type: string
 *                   example: "RSA-4096"
 *                 usage:
 *                   type: string
 *       404:
 *         description: Study not found or keys not generated
 *       500:
 *         description: Internal server error
 */
router.get('/:id/public-key', getStudyPublicKeyEndpoint);

/**
 * @swagger
 * /studies/{id}/participant-data-status:
 *   get:
 *     summary: Check if participant has uploaded data
 *     description: Check whether a specific participant has already submitted data to the study
 *     tags:
 *       - Study Data
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study ID
 *       - in: query
 *         name: participantAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Participant's Ethereum address
 *         example: "0x742d35Cc6635C0532925a3b844D97C6b009af2af9f"
 *     responses:
 *       200:
 *         description: Status retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 studyId:
 *                   type: integer
 *                 participantAddress:
 *                   type: string
 *                 hasUploadedData:
 *                   type: boolean
 *                 uploadedAt:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       400:
 *         description: Missing participant address
 *       500:
 *         description: Internal server error
 */
router.get('/:id/participant-data-status', checkParticipantDataStatus);

/**
 * @swagger
 * /studies/{id}/aggregate-data:
 *   post:
 *     summary: Trigger data aggregation for ended study
 *     description: Aggregate and anonymize participant data (researcher only, study must be ended)
 *     tags:
 *       - Study Data Aggregation
 *     parameters:
 *       - in: path
 *         name: id
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
 *               - researcherAddress
 *             properties:
 *               researcherAddress:
 *                 type: string
 *                 description: Ethereum address of the researcher (must be study creator)
 *                 example: "0x742d35Cc6635C0532925a3b844D97C6b009af2af9f"
 *     responses:
 *       200:
 *         description: Aggregation completed successfully
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
 *                 meetsKAnonymity:
 *                   type: boolean
 *                 aggregatedAt:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                   example: "completed"
 *       400:
 *         description: Invalid request, study not ended, or insufficient participants
 *       403:
 *         description: Unauthorized - not study creator
 *       404:
 *         description: Study not found
 *       500:
 *         description: Aggregation failed
 */
router.post('/:id/aggregate-data', triggerDataAggregation);

/**
 * @swagger
 * /studies/{id}/aggregated-data:
 *   get:
 *     summary: Retrieve aggregated statistics
 *     description: Get anonymized aggregate statistics for ended study (researcher only)
 *     tags:
 *       - Study Data Aggregation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study ID
 *       - in: query
 *         name: researcherAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Researcher's Ethereum address (must be study creator)
 *         example: "0x742d35Cc6635C0532925a3b844D97C6b009af2af9f"
 *     responses:
 *       200:
 *         description: Aggregated data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 studyId:
 *                   type: integer
 *                 studyTitle:
 *                   type: string
 *                 studyDescription:
 *                   type: string
 *                 participantCount:
 *                   type: integer
 *                 aggregatedAt:
 *                   type: string
 *                   format: date-time
 *                 statistics:
 *                   type: object
 *                   description: Anonymized aggregate statistics
 *                 privacyMetrics:
 *                   type: object
 *                   properties:
 *                     kAnonymity:
 *                       type: integer
 *                       example: 10
 *                     suppressedBins:
 *                       type: integer
 *       400:
 *         description: Study not ended
 *       403:
 *         description: Unauthorized - not study creator
 *       404:
 *         description: Study or aggregated data not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/aggregated-data', getAggregatedData);

/**
 * @swagger
 * /studies/{id}/access-logs:
 *   get:
 *     summary: View data access audit logs
 *     description: Retrieve audit trail of who accessed the study data (researcher only)
 *     tags:
 *       - Study Data Aggregation
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Study ID
 *       - in: query
 *         name: researcherAddress
 *         required: true
 *         schema:
 *           type: string
 *         description: Researcher's Ethereum address (must be study creator)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of logs to retrieve
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Pagination offset
 *     responses:
 *       200:
 *         description: Access logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 studyId:
 *                   type: integer
 *                 logs:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                       accessed_at:
 *                         type: string
 *                         format: date-time
 *                       accessed_by:
 *                         type: string
 *                       access_type:
 *                         type: string
 *                         example: "AGGREGATION"
 *                       participant_count:
 *                         type: integer
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     offset:
 *                       type: integer
 *       403:
 *         description: Unauthorized - not study creator
 *       404:
 *         description: Study not found
 *       500:
 *         description: Internal server error
 */
router.get('/:id/access-logs', getAccessLogs);

export default router;
