import type { Request, Response } from "express";
import logger from "@/utils/logger";

import {
  checkIfUserExists,
  getNumberOfUsersOnPlatform,
  getUserByWalletAddress,
  getUserStatsForDataSeller,
  getUserStatsForResearcher,
  updateUserByWalletAddress,
} from "@/services/userService";
import { UserProfile } from "@zk-medical/shared";
import isValidEthereumAddress from "@/utils/address";
import { auditService } from "@/services/auditService";

function toUserDTO(user: { id: string; username: string | null; created_at: string }) {
  return {
    id: user.id,
    username: user.username,
    createdAt: user.created_at,
  };
}

export async function getUserById(req: Request, res: Response) {
  const { walletAddress } = req.params;
  try {
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress is undefined" });
    }

    logger.info({ walletAddress }, "getUser called");

    const user = await getUserByWalletAddress(req.supabase, walletAddress);
    logger.info({ user }, "User get");
    if (!user) {
      logger.info({ walletAddress }, "User not found in getUser");
      return res.status(404).json({ error: "User not found" });
    }

    logger.info({ walletAddress }, "User retrieved successfully");
    return res.status(200).json(toUserDTO(user));
  } catch (err: any) {
    logger.error({ err, walletAddress }, "Unexpected error in getUser");
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { walletAddress } = req.params;
  const updateData = req.body;
  const startTime = Date.now();
  const userAgent = req.get("User-Agent") || "";
  const ipAddress = req.ip || req.socket?.remoteAddress || "";

  try {
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress param is required" });
    }
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update data provided" });
    }

    logger.info({ walletAddress, updateData }, "updateUser called");

    const isUserExists = await checkIfUserExists(req, res, walletAddress);
    if (!isUserExists) {
      logger.info({ walletAddress }, "User not found in updateUser");
      return res.status(404).json({ error: "User not found" });
    }

    const currentUser = await getUserByWalletAddress(req.supabase, walletAddress);
    const oldUsername = currentUser?.username || "";
    const newUsername = updateData.username;

    const updatedUser = await updateUserByWalletAddress(req.supabase, walletAddress, {
      username: updateData.username,
    });

    if (!updatedUser) {
      logger?.error({ walletAddress }, "User update returned null");

      if (newUsername) {
        await auditService
          .logUsernameChange(walletAddress, oldUsername, newUsername, false, {
            reason: "update_returned_null",
            userAgent,
            ipAddress,
            duration: Date.now() - startTime,
          })
          .catch((error) => {
            logger.error({ error }, "Failed to log username change failure");
          });
      }

      return res.status(500).json({ error: "Failed to update user" });
    }

    if (newUsername && newUsername !== oldUsername) {
      await auditService
        .logUsernameChange(walletAddress, oldUsername, newUsername, true, {
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        })
        .catch((error) => {
          logger.error({ error }, "Failed to log username change audit event");
        });
    }

    logger?.info({ walletAddress }, "User updated successfully");
    return res.status(200).json(toUserDTO(updatedUser));
  } catch (err: any) {
    logger?.error({ err, walletAddress }, "Error in updateUser");

    if (updateData?.username && typeof updateData.username === "string") {
      const newUsername = updateData.username;
      await auditService
        .logUsernameChange(walletAddress!, "", newUsername, false, {
          error: err.message || "Unknown error",
          userAgent,
          ipAddress,
          duration: Date.now() - startTime,
        })
        .catch((auditError) => {
          logger.error({ auditError }, "Failed to log username change failure");
        });
    }

    if (err.message && err.message.includes("Invalid username")) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function getUserStats(req: Request, res: Response) {
  const { walletAddress, profile } = req.params;

  try {
    if (!isValidEthereumAddress(walletAddress)) {
      return res.status(400).json({ error: "Invalid wallet address format" });
    }

    if (!profile || !(profile in UserProfile)) {
      return res.status(400).json({
        error: "Invalid profile. Must be one of: DATA_SELLER, RESEARCHER",
      });
    }

    const profileValue = UserProfile[profile as keyof typeof UserProfile];

    logger.info({ walletAddress, profile, profileValue }, "getUserStats called");

    switch (profileValue) {
      case UserProfile.DATA_SELLER: {
        const dataSellerstats = await getUserStatsForDataSeller(req.supabase, walletAddress);
        return res.status(200).json(dataSellerstats);
      }

      case UserProfile.RESEARCHER: {
        const researcherStats = await getUserStatsForResearcher(req.supabase, walletAddress);
        return res.status(200).json(researcherStats);
      }

      default:
        return res.status(400).json({
          error: "Stats not available for this profile type",
        });
    }
  } catch (err: any) {
    logger.error({ err, walletAddress, profile }, "Error in getUserStats");
    return res.status(500).json({ error: "Internal server error" });
  }
}
export async function getPlatformUserCount(req: Request, res: Response) {
  try {
    logger.info("getPlatformUserCount called");

    const count = await getNumberOfUsersOnPlatform(req.supabase);

    logger.info({ count }, "Platform user count retrieved successfully");
    return res.status(200).json({ count });
  } catch (err: any) {
    logger.error({ err }, "Error in getPlatformUserCount");
    return res.status(500).json({ error: "Internal server error" });
  }
}
