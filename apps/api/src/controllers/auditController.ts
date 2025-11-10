import type { Request, Response } from "express";
import { auditService, ActionType } from "@/services/auditService";
import { isValidEthereumAddress } from "@/utils/address";
import logger from "@/utils/logger";
import { UserProfile } from "@zk-medical/shared";

export const getUserActionsByProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress, profile } = req.params;
    const { limit = "20" } = req.query;

    if (!isValidEthereumAddress(userAddress)) {
      res.status(400).json({
        success: false,
        error: "Invalid user address format",
      });
      return;
    }

    const userProfile = Number.parseInt(profile as string);
    if (isNaN(userProfile) || !Object.values(UserProfile).includes(userProfile)) {
      res.status(400).json({
        success: false,
        error:
          "Invalid user profile. Must be 0 (RESEARCHER), 1 (DATA_SELLER), 2 (ADMIN), or 3 (COMMON)",
      });
      return;
    }

    const limitNum = Number.parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: "Invalid limit. Must be between 1 and 100",
      });
      return;
    }

    const actions = await auditService.getUserActionsForProfile(
      userAddress,
      userProfile as UserProfile,
      limitNum
    );

    logger.info(
      {
        userAddress,
        profile: UserProfile[userProfile],
        requestedLimit: limitNum,
        returnedRecords: actions.length,
      },
      "Retrieved user actions by profile"
    );

    res.json({
      success: true,
      data: {
        userAddress,
        profile: UserProfile[userProfile],
        actions,
        count: actions.length,
      },
    });
  } catch (error) {
    logger.error(
      {
        error,
        userAddress: req.params.userAddress,
        profile: req.params.profile,
      },
      "Failed to get user actions by profile"
    );

    res.status(500).json({
      success: false,
      error: "Internal server error while retrieving audit actions",
    });
  }
};

export const getUserActionsByProfilePaginated = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userAddress, profile } = req.params;
    const { offset = "0", limit = "20", latestFirst = "true" } = req.query;

    if (!isValidEthereumAddress(userAddress)) {
      res.status(400).json({
        success: false,
        error: "Invalid user address format",
      });
      return;
    }
    const userProfile = Number.parseInt(profile as string);
    if (isNaN(userProfile) || !Object.values(UserProfile).includes(userProfile)) {
      res.status(400).json({
        success: false,
        error:
          "Invalid user profile. Must be 0 (RESEARCHER), 1 (DATA_SELLER), 2 (ADMIN), or 3 (COMMON)",
      });
      return;
    }

    const offsetNum = Number.parseInt(offset as string);
    if (isNaN(offsetNum) || offsetNum < 0) {
      res.status(400).json({
        success: false,
        error: "Invalid offset. Must be >= 0",
      });
      return;
    }

    const limitNum = Number.parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: "Invalid limit. Must be between 1 and 100",
      });
      return;
    }

    const latestFirstBool = latestFirst === "true";

    const result = await auditService.getUserActionsForProfilePaginated(
      userAddress,
      userProfile as UserProfile,
      offsetNum,
      limitNum,
      latestFirstBool
    );

    logger.info(
      {
        userAddress,
        profile: UserProfile[userProfile],
        offset: offsetNum,
        limit: limitNum,
        latestFirst: latestFirstBool,
        totalRecords: result.total,
        returnedRecords: result.records.length,
      },
      "Retrieved paginated user actions by profile"
    );

    try {
      res.json({
        success: true,
        data: {
          userAddress,
          profile: UserProfile[userProfile],
          records: result.records,
          pagination: {
            offset: offsetNum,
            limit: limitNum,
            total: result.total,
            hasMore: offsetNum + limitNum < result.total,
          },
        },
      });
    } catch (jsonError) {
      logger.error({ jsonError }, "Failed to serialize audit response");

      res.status(500).json({
        success: false,
        error: "Failed to serialize response data",
      });
      return;
    }
  } catch (error) {
    logger.error(
      {
        error,
        userAddress: req.params.userAddress,
        profile: req.params.profile,
      },
      "Failed to get paginated user actions by profile"
    );

    res.status(500).json({
      success: false,
      error: "Internal server error while retrieving paginated audit actions",
    });
  }
};

export const getAuditRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recordId } = req.params;

    if (!recordId) {
      res.status(400).json({
        success: false,
        error: "Record ID is required",
      });
      return;
    }

    const recordIdNum = Number.parseInt(recordId);
    if (isNaN(recordIdNum) || recordIdNum < 0) {
      res.status(400).json({
        success: false,
        error: "Invalid record ID. Must be a non-negative number",
      });
      return;
    }

    const record = await auditService.getAuditRecord(recordIdNum);

    if (!record) {
      res.status(404).json({
        success: false,
        error: "Audit record not found",
      });
      return;
    }

    logger.info(
      {
        recordId: recordIdNum,
      },
      "Retrieved audit record"
    );

    res.json({
      success: true,
      data: {
        record,
      },
    });
  } catch (error) {
    logger.error(
      {
        error,
        recordId: req.params.recordId,
      },
      "Failed to get audit record"
    );

    res.status(500).json({
      success: false,
      error: "Internal server error while retrieving audit record",
    });
  }
};

export const getAllUserActions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress } = req.params;
    const { limit = "20" } = req.query;

    if (!isValidEthereumAddress(userAddress)) {
      res.status(400).json({
        success: false,
        error: "Invalid user address format",
      });
      return;
    }

    const limitNum = Number.parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
      res.status(400).json({
        success: false,
        error: "Invalid limit. Must be between 1 and 100",
      });
      return;
    }

    const actions = await auditService.getUserActions(userAddress, limitNum);

    logger.info(
      {
        userAddress,
        actionsCount: actions.length,
      },
      "Retrieved all user actions"
    );

    res.json({
      success: true,
      data: {
        userAddress,
        actions,
        count: actions.length,
      },
    });
  } catch (error) {
    logger.error(
      {
        error,
        userAddress: req.params.userAddress,
      },
      "Failed to get all user actions"
    );

    res.status(500).json({
      success: false,
      error: "Internal server error while retrieving all user actions",
    });
  }
};

export const getAuditInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const profiles = Object.keys(UserProfile)
      .filter((key) => isNaN(Number(key)))
      .map((key) => ({
        name: key,
        value: UserProfile[key as keyof typeof UserProfile],
      }));

    const actionTypes = Object.keys(ActionType)
      .filter((key) => isNaN(Number(key)))
      .map((key) => ({
        name: key,
        value: ActionType[key as keyof typeof ActionType],
      }));

    res.json({
      success: true,
      data: {
        profiles,
        actionTypes,
      },
    });
  } catch (error) {
    logger.error({ error }, "Failed to get audit info");

    res.status(500).json({
      success: false,
      error: "Internal server error while retrieving audit info",
    });
  }
};

export const logFileAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress, encryptedCID, accessType, success, resourceType, metadata } = req.body;

    if (!userAddress || !encryptedCID || !accessType) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: userAddress, encryptedCID, accessType",
      });
      return;
    }

    if (!isValidEthereumAddress(userAddress)) {
      res.status(400).json({
        success: false,
        error: "Invalid user address format",
      });
      return;
    }

    if (!["view", "download"].includes(accessType)) {
      res.status(400).json({
        success: false,
        error: "Invalid access type. Must be 'view' or 'download'",
      });
      return;
    }

    const result = await auditService.logDataAccess(
      userAddress,
      encryptedCID,
      accessType,
      success !== false,
      resourceType,
      metadata || {}
    );

    if (result.success) {
      logger.info(
        {
          userAddress,
          accessType,
          txHash: result.txHash,
        },
        "File access logged successfully"
      );

      res.json({
        success: true,
        data: {
          txHash: result.txHash,
          message: `Data ${accessType} logged successfully`,
        },
      });
    } else {
      logger.error(
        {
          userAddress,
          accessType,
          error: result.error,
        },
        "Failed to log file access"
      );

      res.status(500).json({
        success: false,
        error: result.error || "Failed to log file access",
      });
    }
  } catch (error) {
    logger.error(
      {
        error,
        body: req.body,
      },
      "Failed to log file access"
    );

    res.status(500).json({
      success: false,
      error: "Internal server error while logging file access",
    });
  }
};

export const logFailedJoinStudy = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress, studyId, reason, errorDetails, metadata } = req.body;

    if (!userAddress || !studyId) {
      res.status(400).json({
        success: false,
        error: "Missing required fields: userAddress, studyId",
      });
      return;
    }

    if (!isValidEthereumAddress(userAddress)) {
      res.status(400).json({
        success: false,
        error: "Invalid user address format",
      });
      return;
    }

    const studyIdNum = Number.parseInt(studyId);
    if (isNaN(studyIdNum) || studyIdNum < 0) {
      res.status(400).json({
        success: false,
        error: "Invalid studyId. Must be a non-negative number",
      });
      return;
    }

    const enrichedMetadata = {
      reason: reason || "Unknown error",
      errorDetails,
      ...metadata,
    };

    const result = await auditService.logStudyParticipation(
      userAddress,
      studyIdNum.toString(),
      false,
      enrichedMetadata
    );

    if (result.success) {
      logger.info(
        {
          userAddress,
          studyId: studyIdNum,
          reason,
          txHash: result.txHash,
        },
        "Failed study join attempt logged successfully"
      );

      res.json({
        success: true,
        data: {
          txHash: result.txHash,
          message: "Failed study join attempt logged successfully",
        },
      });
    } else {
      logger.error(
        {
          userAddress,
          studyId: studyIdNum,
          error: result.error,
        },
        "Failed to log failed study join attempt"
      );

      res.status(500).json({
        success: false,
        error: result.error || "Failed to log failed study join attempt",
      });
    }
  } catch (error) {
    logger.error(
      {
        error,
        body: req.body,
      },
      "Failed to log failed study join attempt"
    );

    res.status(500).json({
      success: false,
      error: "Internal server error while logging failed study join attempt",
    });
  }
};
