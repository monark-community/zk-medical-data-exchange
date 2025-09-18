import logger from "@/utils/logger";
import { Router } from "express";

const router = Router();

router.post("/create-session", async (req, res) => {
  try {
    console.log(req.body);
    const { walletAddress } = req.body;

    if (!walletAddress || typeof walletAddress !== 'string') {
      return res.status(400).json({
        error: "Invalid wallet address"
      });
    }

    if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
      return res.status(400).json({
        error: "Invalid wallet address format"
      });
    }

    res.status(201).json({
      success: true,
      walletAddress,
    });

  } catch (error) {
    logger.error(`Error creating session: ${error}`);
    res.status(500).json({
      error: "Internal server error"
    });
  }
});

export default router;
