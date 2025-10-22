import type { Request, Response } from "express";
import logger from "@/utils/logger";

import {
  checkIfUserExists,
  getUserByWalletAddress,
  updateUserByWalletAddress,
} from "@/services/userService";

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
      return res.status(400).json({ error: "walletAddress param is required" });
    }

    logger?.info({ walletAddress }, "getUser called");

    // Business/data access lives in the service:
    const user = await getUserByWalletAddress(req.supabase, walletAddress);
    logger?.info({ user }, "User get");
    if (!user) {
      logger?.info({ walletAddress }, "User not found in getUser");
      return res.status(404).json({ error: "User not found" });
    }

    logger?.info({ walletAddress }, "User retrieved successfully");
    return res.status(200).json(toUserDTO(user));
  } catch (err: any) {
    // Service throws a descriptive error string; keep logs detailed, response generic
    logger?.error({ err, walletAddress }, "Unexpected error in getUser");
    return res.status(500).json({ error: "Internal server error" });
  }
}

export async function updateUser(req: Request, res: Response) {
  const { walletAddress } = req.params;
  const updateData = req.body;

  try {
    if (!walletAddress) {
      return res.status(400).json({ error: "walletAddress param is required" });
    }

    // Validate that we have something to update
    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ error: "No update data provided" });
    }

    logger?.info({ walletAddress, updateData }, "updateUser called");

    // Check if user exists first
    const isUserExists = await checkIfUserExists(req, res, walletAddress);
    if (!isUserExists) {
      logger?.info({ walletAddress }, "User not found in updateUser");
      return res.status(404).json({ error: "User not found" });
    }

    // Update the user
    const updatedUser = await updateUserByWalletAddress(req.supabase, walletAddress, {
      username: updateData.username,
    });

    if (!updatedUser) {
      logger?.error({ walletAddress }, "User update returned null");
      return res.status(500).json({ error: "Failed to update user" });
    }

    logger?.info({ walletAddress }, "User updated successfully");
    return res.status(200).json(toUserDTO(updatedUser));
  } catch (err: any) {
    logger?.error({ err, walletAddress }, "Error in updateUser");

    // Return validation errors directly to the user
    if (err.message && err.message.includes("Invalid username")) {
      return res.status(400).json({ error: err.message });
    }

    return res.status(500).json({ error: "Internal server error" });
  }
}
