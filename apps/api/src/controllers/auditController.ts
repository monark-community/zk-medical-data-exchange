import type { Request, Response } from "express";
import { auditService, UserProfile, ActionType } from "@/services/auditService";
import logger from "@/utils/logger";

/**
 * Audit Controller - Handles audit trail queries and management
 */

/**
 * Get user actions for a specific profile (including COMMON actions)
 * GET /api/audit/user/:userAddress/profile/:profile/actions
 */
export const getUserActionsByProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress, profile } = req.params;
    const { limit = "100" } = req.query;

    // Validate user address format
    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      res.status(400).json({
        success: false,
        error: "Invalid user address format",
      });
      return;
    }

    // Validate and convert profile
    const userProfile = parseInt(profile as string);
    if (isNaN(userProfile) || !Object.values(UserProfile).includes(userProfile)) {
      res.status(400).json({
        success: false,
        error:
          "Invalid user profile. Must be 0 (RESEARCHER), 1 (DATA_SELLER), 2 (ADMIN), or 3 (COMMON)",
      });
      return;
    }

    // Validate limit
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      res.status(400).json({
        success: false,
        error: "Invalid limit. Must be between 1 and 1000",
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
        actionsCount: actions.length,
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

/**
 * Get paginated user actions for a specific profile (including COMMON actions)
 * GET /api/audit/user/:userAddress/profile/:profile/actions/paginated
 */
export const getUserActionsByProfilePaginated = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { userAddress, profile } = req.params;
    const { offset = "0", limit = "100", latestFirst = "true" } = req.query;

    // Validate user address format
    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      res.status(400).json({
        success: false,
        error: "Invalid user address format",
      });
      return;
    }

    // Validate and convert profile
    const userProfile = parseInt(profile as string);
    if (isNaN(userProfile) || !Object.values(UserProfile).includes(userProfile)) {
      res.status(400).json({
        success: false,
        error:
          "Invalid user profile. Must be 0 (RESEARCHER), 1 (DATA_SELLER), 2 (ADMIN), or 3 (COMMON)",
      });
      return;
    }

    // Validate offset
    const offsetNum = parseInt(offset as string);
    if (isNaN(offsetNum) || offsetNum < 0) {
      res.status(400).json({
        success: false,
        error: "Invalid offset. Must be >= 0",
      });
      return;
    }

    // Validate limit
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      res.status(400).json({
        success: false,
        error: "Invalid limit. Must be between 1 and 1000",
      });
      return;
    }

    // Convert latestFirst to boolean
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

    // Debug log to check data structure before serialization
    console.log("About to serialize result:", {
      recordsType: typeof result.records,
      recordsLength: result.records.length,
      totalType: typeof result.total,
      total: result.total,
      firstRecord: result.records[0]
        ? {
            keys: Object.keys(result.records[0]),
            sample: result.records[0],
            isArray: Array.isArray(result.records[0]),
            stringified: JSON.stringify(result.records[0], (key, value) =>
              typeof value === "bigint" ? value.toString() + "n" : value
            ),
          }
        : "No records",
      sampleRecords: result.records.slice(0, 2).map((record, index) => ({
        index,
        type: typeof record,
        isArray: Array.isArray(record),
        length: Array.isArray(record) ? record.length : "not array",
        structure: Array.isArray(record)
          ? record.map((item, i) => `[${i}]: ${typeof item}`)
          : "not array",
      })),
    });

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
      console.error("JSON serialization error:", jsonError);
      logger.error({ jsonError, resultStructure: typeof result }, "Failed to serialize response");

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

/**
 * Get user actions for profile-specific actions only (excludes COMMON actions)
 * GET /api/audit/user/:userAddress/profile/:profile/actions/profile-only
 */
export const getUserProfileActionsOnly = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress, profile } = req.params;
    const { offset = "0", limit = "100", latestFirst = "true" } = req.query;

    // Validate user address format
    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      res.status(400).json({
        success: false,
        error: "Invalid user address format",
      });
      return;
    }

    // Validate and convert profile
    const userProfile = parseInt(profile as string);
    if (isNaN(userProfile) || !Object.values(UserProfile).includes(userProfile)) {
      res.status(400).json({
        success: false,
        error:
          "Invalid user profile. Must be 0 (RESEARCHER), 1 (DATA_SELLER), 2 (ADMIN), or 3 (COMMON)",
      });
      return;
    }

    // Validate offset
    const offsetNum = parseInt(offset as string);
    if (isNaN(offsetNum) || offsetNum < 0) {
      res.status(400).json({
        success: false,
        error: "Invalid offset. Must be >= 0",
      });
      return;
    }

    // Validate limit
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      res.status(400).json({
        success: false,
        error: "Invalid limit. Must be between 1 and 1000",
      });
      return;
    }

    // Convert latestFirst to boolean
    const latestFirstBool = latestFirst === "true";

    const result = await auditService.getUserProfileActionsPaginated(
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
      "Retrieved profile-only user actions"
    );

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
  } catch (error) {
    logger.error(
      {
        error,
        userAddress: req.params.userAddress,
        profile: req.params.profile,
      },
      "Failed to get profile-only user actions"
    );

    res.status(500).json({
      success: false,
      error: "Internal server error while retrieving profile-only audit actions",
    });
  }
};

/**
 * Get a specific audit record by ID
 * GET /api/audit/record/:recordId
 */
export const getAuditRecord = async (req: Request, res: Response): Promise<void> => {
  try {
    const { recordId } = req.params;

    // Validate record ID
    if (!recordId) {
      res.status(400).json({
        success: false,
        error: "Record ID is required",
      });
      return;
    }

    const recordIdNum = parseInt(recordId);
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

/**
 * Get all user actions (across all profiles)
 * GET /api/audit/user/:userAddress/actions
 */
export const getAllUserActions = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userAddress } = req.params;
    const { limit = "100" } = req.query;

    // Validate user address format
    if (!userAddress || !userAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
      res.status(400).json({
        success: false,
        error: "Invalid user address format",
      });
      return;
    }

    // Validate limit
    const limitNum = parseInt(limit as string);
    if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
      res.status(400).json({
        success: false,
        error: "Invalid limit. Must be between 1 and 1000",
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

/**
 * Get profile and action type information
 * GET /api/audit/info
 */
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
