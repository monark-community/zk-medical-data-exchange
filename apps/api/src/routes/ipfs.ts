import { Router } from "express";
import { deleteFile, getPresignedIpfsUrl } from "@/controllers/ipfsController";

const router = Router();
/**
 * @swagger
 * /ipfs:
 *   get:
 *     summary: Get presigned Pinata upload URL
 *     description: Returns a temporary signed URL that allows the client to upload a file directly to Pinata.
 *     parameters:
 *       - in: query
 *         name: expires
 *         description: Expiration time for the signed URL in seconds.
 *         schema:
 *           type: integer
 *       - in: query
 *         name: mime
 *         description: MIME type of the file to be uploaded.
 *         schema:
 *           type: string
 *       - in: query
 *         name: maxSize
 *         description: Maximum file size allowed for upload in bytes.
 *         schema:
 *           type: integer
 *       - in: query
 *         name: filename
 *         description: Optional filename for the uploaded file.
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Presigned URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 url:
 *                   type: string
 *                   description: Signed upload URL to post the file to.
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

router.get("/", getPresignedIpfsUrl);

/**
 * @swagger
 * /ipfs:
 *   delete:
 *     summary: Delete a file from IPFS
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               file_id:
 *                 type: string
 *                 description: The ID of the file to be deleted from IPFS
 *     responses:
 *       200:
 *         description: File deleted successfully
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

router.delete("/", deleteFile);

export default router;
