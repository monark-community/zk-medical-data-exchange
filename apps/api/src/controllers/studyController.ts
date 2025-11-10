import type { Request, Response } from "express";
import {
  STUDY_TEMPLATES,
  createCriteria,
  validateCriteria,
  countEnabledCriteria,
  getStudyComplexity,
  type StudyCriteria,
} from "@zk-medical/shared";
import logger from "@/utils/logger";
import crypto from "crypto";
import { TABLES } from "@/constants/db";
import { auditService } from "@/services/auditService";
import { studyService } from "@/services/studyService";
import { SEPOLIA_TESTNET_CHAIN_ID } from "@/constants/blockchain";

const getAuditMetadata = (req: Request) => ({
  startTime: Date.now(),
  userAgent: req.get("User-Agent") || "",
  ipAddress: req.ip || req.socket?.remoteAddress || "",
});

const getAuditDuration = (startTime: number) => Date.now() - startTime;

const updateStudyParticipantCount = async (
  supabase: any,
  studyId: string | number,
  study?: any
) => {
  const activeCount = await getActiveParticipantCount(supabase, studyId);

  if (!study || study.current_participants !== activeCount) {
    await supabase
      .from(TABLES.STUDIES!.name)
      .update({ current_participants: activeCount })
      .eq(TABLES.STUDIES!.columns.id!, studyId);
  }

  return activeCount;
};

const validateConsentRequest = (
  id: string | undefined,
  participantWallet: string | undefined,
  res: Response
): id is string => {
  if (!id) {
    res.status(400).json({ error: "Study ID is required" });
    return false;
  }
  if (!participantWallet) {
    res.status(400).json({ error: "Participant wallet address is required" });
    return false;
  }
  return true;
};

const fetchParticipation = async (supabase: any, id: string, participantWallet: string) => {
  const { data, error } = await supabase
    .from(TABLES.STUDY_PARTICIPATIONS!.name)
    .select("*, study:study_id(*)")
    .eq(TABLES.STUDY_PARTICIPATIONS!.columns.studyId!, id)
    .eq(TABLES.STUDY_PARTICIPATIONS!.columns.participantWallet!, participantWallet)
    .single();

  return { data, error };
};

const canPerformConsentOperation = (currentStatus: boolean, isRevoke: boolean): boolean => {
  return isRevoke ? currentStatus === true : currentStatus === false;
};

const executeBlockchainConsent = async (
  blockchainMethod: any,
  contractAddress: string,
  participantWallet: string,
  id: string,
  operation: string
) => {
  logger.info(
    { studyId: id, participantWallet, studyContractAddress: contractAddress },
    `Calling blockchain ${operation} consent`
  );

  const result = await blockchainMethod(contractAddress, participantWallet);

  logger.info(
    {
      studyId: id,
      participantWallet,
      blockchainResult: result,
      success: result.success,
      error: result.error,
      txHash: result.transactionHash,
    },
    `Blockchain ${operation} consent result`
  );

  return result;
};

const updateConsentInDatabase = async (
  supabase: any,
  id: string,
  participantWallet: string,
  newStatus: boolean
) => {
  const { error } = await supabase
    .from(TABLES.STUDY_PARTICIPATIONS!.name)
    .update({ has_consented: newStatus })
    .eq(TABLES.STUDY_PARTICIPATIONS!.columns.studyId!, id)
    .eq(TABLES.STUDY_PARTICIPATIONS!.columns.participantWallet!, participantWallet);

  return error;
};

const updateParticipantCount = async (
  supabase: any,
  id: string,
  studyRecord: any,
  delta: number
) => {
  const newCount = Math.max(0, studyRecord.current_participants + delta);
  await supabase
    .from(TABLES.STUDIES!.name)
    .update({ current_participants: newCount })
    .eq(TABLES.STUDIES!.columns.id!, id);
};

const processBlockchainConsent = async (
  studyContractAddress: string | undefined,
  blockchainMethod: any,
  participantWallet: string,
  id: string,
  operation: string,
  res: Response
): Promise<string | null> => {
  if (!studyContractAddress) {
    logger.info(
      { studyId: id },
      `Study not deployed to blockchain - proceeding to database update only`
    );
    return null;
  }

  try {
    const blockchainResult = await executeBlockchainConsent(
      blockchainMethod,
      studyContractAddress,
      participantWallet,
      id,
      operation
    );

    if (!blockchainResult.success) {
      logger.error(
        {
          error: blockchainResult.error,
          errorString: String(blockchainResult.error),
          errorJSON: JSON.stringify(blockchainResult.error),
          studyId: id,
          participantWallet,
        },
        `Failed to ${operation} consent on blockchain - ABORTING (no database update)`
      );
      res.status(500).json({
        error: `Failed to ${operation} consent on blockchain`,
        details: blockchainResult.error,
      });
      return undefined as any;
    }

    const txHash = blockchainResult.transactionHash;
    logger.info(
      { studyId: id, participantWallet, txHash },
      `Consent ${
        operation === "revoke" ? "revoked" : "granted"
      } on blockchain - proceeding to database update`
    );
    return txHash;
  } catch (blockchainError) {
    logger.error(
      { error: blockchainError, studyId: id, participantWallet },
      `Error during blockchain consent ${operation} - ABORTING (no database update)`
    );
    res.status(500).json({
      error: `Error during blockchain consent ${operation}`,
      details: blockchainError instanceof Error ? blockchainError.message : "Unknown error",
    });
    return undefined as any;
  }
};

const logConsentAudit = async (
  auditLogger: any,
  participantWallet: string,
  studyId: string,
  success: boolean,
  metadata: any,
  operation: string
) => {
  await auditLogger(participantWallet, studyId, success, metadata).catch((error: any) => {
    logger.error(
      { error },
      `Failed to log consent ${operation} ${success ? "audit event" : "failure"}`
    );
  });
};

const handleConsentError = async (
  error: unknown,
  req: Request,
  res: Response,
  operation: string,
  auditLogger: any,
  auditMetadata: { userAgent: string; ipAddress: string; duration: number }
) => {
  logger.error(
    {
      error:
        error instanceof Error
          ? {
              message: error.message,
              stack: error.stack,
              name: error.name,
            }
          : error,
      studyId: req.params.id,
    },
    `${operation.charAt(0).toUpperCase() + operation.slice(1)} consent error`
  );

  const { participantWallet } = req.body;
  if (participantWallet) {
    await logConsentAudit(
      auditLogger,
      participantWallet,
      String(req.params.id),
      false,
      {
        error: error instanceof Error ? error.message : "Unknown error",
        ...auditMetadata,
      },
      operation
    );
  }

  res.status(500).json({ error: "Internal server error" });
};

const handleConsentOperation = async (
  req: Request,
  res: Response,
  operation: "revoke" | "grant"
) => {
  const { startTime, userAgent, ipAddress } = getAuditMetadata(req);
  const isRevoke = operation === "revoke";
  const auditLogger = isRevoke
    ? auditService.logConsentRevocation.bind(auditService)
    : auditService.logConsentGranting.bind(auditService);
  const blockchainMethod = isRevoke
    ? studyService.revokeStudyConsent.bind(studyService)
    : studyService.grantStudyConsent.bind(studyService);

  try {
    const { id } = req.params;
    const { participantWallet } = req.body;

    if (!validateConsentRequest(id, participantWallet, res)) {
      return;
    }

    logger.info({ studyId: id, participantWallet }, `POST /api/studies/:id/consent/${operation}`);

    const { data: participation, error: participationError } = await fetchParticipation(
      req.supabase,
      id,
      participantWallet
    );

    if (participationError || !participation) {
      logger.warn(
        { studyId: id, participantWallet, error: participationError },
        "Participation not found"
      );
      return res.status(404).json({ error: "Participation not found in this study" });
    }

    const currentConsentStatus = participation.has_consented ?? true;

    if (!canPerformConsentOperation(currentConsentStatus, isRevoke)) {
      const message = isRevoke ? "Consent already revoked" : "Consent already active";
      logger.warn(
        { studyId: id, participantWallet, currentConsent: currentConsentStatus },
        message
      );
      return res.status(400).json({ error: message });
    }

    const studyContractAddress = (participation.study as any)?.contract_address;
    const blockchainTxHash = await processBlockchainConsent(
      studyContractAddress,
      blockchainMethod,
      participantWallet,
      id,
      operation,
      res
    );

    if (blockchainTxHash === undefined) {
      return;
    }

    const newConsentStatus = !isRevoke;
    const updateError = await updateConsentInDatabase(
      req.supabase,
      id,
      participantWallet,
      newConsentStatus
    );

    if (updateError) {
      logger.error(
        { error: updateError, studyId: id, participantWallet },
        "Failed to update consent status in database"
      );
      return res.status(500).json({ error: `Failed to ${operation} consent in database` });
    }

    logger.info(
      { studyId: id, participantWallet },
      `Consent ${isRevoke ? "revoked" : "granted"} in database`
    );

    const studyRecord = participation.study as any;
    if (studyRecord) {
      const delta = isRevoke ? -1 : 1;
      await updateParticipantCount(req.supabase, id, studyRecord, delta);
    }

    await logConsentAudit(
      auditLogger,
      participantWallet,
      String(id),
      true,
      {
        blockchainTxHash,
        userAgent,
        ipAddress,
        duration: getAuditDuration(startTime),
      },
      operation
    );

    res.status(200).json({
      success: true,
      message: `Consent ${isRevoke ? "revoked" : "granted"} successfully`,
      blockchainTxHash,
    });
  } catch (error) {
    await handleConsentError(error, req, res, operation, auditLogger, {
      userAgent,
      ipAddress,
      duration: getAuditDuration(startTime),
    });
  }
};

const getActiveParticipantCount = async (supabase: any, studyId: string | number) => {
  const { count, error } = await supabase
    .from(TABLES.STUDY_PARTICIPATIONS!.name)
    .select("*", { count: "exact", head: true })
    .eq(TABLES.STUDY_PARTICIPATIONS!.columns.studyId!, studyId)
    .eq(TABLES.STUDY_PARTICIPATIONS!.columns.hasConsented!, true);

  if (error) {
    logger.error({ error, studyId }, "Failed to get active participant count");
    return 0;
  }

  return count || 0;
};

const transformStudyForResponse = (study: any, isEnrolled?: boolean, hasConsented?: boolean) => {
  let criteriaDetails = null;
  if (study.criteria_json) {
    try {
      criteriaDetails =
        typeof study.criteria_json === "string"
          ? JSON.parse(study.criteria_json)
          : study.criteria_json;
    } catch (e) {
      logger.error(
        { error: e, studyId: study.id },
        "Failed to parse criteria JSON for study transformation"
      );
    }
  }

  const studyCriteriaSummary: any = {
    requiresAge: study.requires_age,
    requiresGender: study.requires_gender,
    requiresDiabetes: study.requires_diabetes,
  };

  if (criteriaDetails) {
    studyCriteriaSummary.requiresSmoking = criteriaDetails.enableSmoking === 1;
    studyCriteriaSummary.requiresBMI = criteriaDetails.enableBMI === 1;
    studyCriteriaSummary.requiresBloodPressure = criteriaDetails.enableBloodPressure === 1;
    studyCriteriaSummary.requiresCholesterol = criteriaDetails.enableCholesterol === 1;
    studyCriteriaSummary.requiresHeartDisease = criteriaDetails.enableHeartDisease === 1;
    studyCriteriaSummary.requiresActivity = criteriaDetails.enableActivity === 1;
    studyCriteriaSummary.requiresHbA1c = criteriaDetails.enableHbA1c === 1;
    studyCriteriaSummary.requiresBloodType = criteriaDetails.enableBloodType === 1;
    studyCriteriaSummary.requiresLocation = criteriaDetails.enableLocation === 1;
  }

  const transformed: any = {
    id: study.id,
    title: study.title,
    description: study.description,
    maxParticipants: study.max_participants,
    currentParticipants: study.current_participants,
    durationDays: study.duration_days,
    status: study.status,
    complexityScore: study.complexity_score,
    templateName: study.template_name,
    createdAt: study.created_at,
    contractAddress: study.contract_address,
    criteriaSummary: studyCriteriaSummary,
  };

  if (isEnrolled !== undefined) {
    transformed.isEnrolled = isEnrolled;
  }

  if (hasConsented !== undefined) {
    transformed.hasConsented = hasConsented;
  }

  return transformed;
};

export const createStudy = async (req: Request, res: Response) => {
  const { startTime, userAgent, ipAddress } = getAuditMetadata(req);
  let creatorAddress = "";

  try {
    const {
      title,
      description,
      maxParticipants = 100,
      durationDays = 365,
      templateName,
      customCriteria,
      createdBy,
      principalInvestigator,
    } = req.body;

    creatorAddress = createdBy || principalInvestigator;

    if (!title) {
      auditService
        .logStudyCreation(creatorAddress || "unknown", "unknown", false, {
          reason: "missing_title",
          userAgent,
          ipAddress,
          duration: getAuditDuration(startTime),
        })
        .catch((error) => {
          logger.error({ error }, "Failed to log study creation audit event");
        });
      return res.status(400).json({ error: "Study title is required" });
    }

    let eligibilityCriteria: StudyCriteria;
    let actualTemplateName: string | null = null;

    if (templateName && STUDY_TEMPLATES[templateName as keyof typeof STUDY_TEMPLATES]) {
      eligibilityCriteria = STUDY_TEMPLATES[templateName as keyof typeof STUDY_TEMPLATES];
      actualTemplateName = templateName;
      logger.info({ templateName }, "Using study template");
    } else if (customCriteria) {
      eligibilityCriteria = createCriteria(customCriteria);
      logger.info("Using custom criteria");
    } else {
      eligibilityCriteria = createCriteria();
      logger.info("Creating open study");
    }

    const validation = validateCriteria(eligibilityCriteria);
    if (!validation.valid) {
      auditService
        .logStudyCreation(creatorAddress, "unknown", false, {
          reason: "invalid_criteria",
          errors: validation.errors,
          userAgent,
          ipAddress,
          duration: getAuditDuration(startTime),
        })
        .catch((error) => {
          logger.error({ error }, "Failed to log study creation audit event");
        });
      return res.status(400).json({
        error: "Invalid study criteria",
        details: validation.errors,
      });
    }

    const enabledCount = countEnabledCriteria(eligibilityCriteria);
    const complexity = getStudyComplexity(eligibilityCriteria);
    const criteriaHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(eligibilityCriteria))
      .digest("hex");

    const requiresAge = eligibilityCriteria.enableAge === 1;
    const requiresGender = eligibilityCriteria.enableGender === 1;
    const requiresDiabetes = eligibilityCriteria.enableDiabetes === 1;

    const insertData = {
      title,
      description,
      max_participants: maxParticipants,
      duration_days: durationDays,
      criteria_json: eligibilityCriteria,
      criteria_hash: criteriaHash,
      requires_age: requiresAge,
      min_age: requiresAge ? eligibilityCriteria.minAge : null,
      max_age: requiresAge ? eligibilityCriteria.maxAge : null,
      requires_gender: requiresGender,
      allowed_gender: requiresGender ? eligibilityCriteria.allowedGender : null,
      requires_diabetes: requiresDiabetes,
      allowed_diabetes: requiresDiabetes ? eligibilityCriteria.allowedDiabetes : null,
      status: "draft",
      current_participants: 0,
      created_by: creatorAddress,
      complexity_score: enabledCount,
      template_name: actualTemplateName,
      chain_id: SEPOLIA_TESTNET_CHAIN_ID,
    };

    const { data: studyData, error: insertError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      logger.error({ error: insertError }, "Failed to create study");

      auditService
        .logStudyCreation(creatorAddress, "unknown", false, {
          reason: "database_error",
          error: insertError.message,
          userAgent,
          ipAddress,
          duration: getAuditDuration(startTime),
        })
        .catch((error) => {
          logger.error({ error }, "Failed to log study creation audit event");
        });

      return res.status(500).json({ error: "Failed to create study" });
    }

    logger.info({ studyId: studyData.id, title }, "Study created successfully");

    auditService
      .logStudyCreation(creatorAddress, studyData.id.toString(), true, {
        title,
        templateName: actualTemplateName,
        maxParticipants,
        durationDays,
        complexityScore: enabledCount,
        userAgent,
        ipAddress,
        duration: getAuditDuration(startTime),
      })
      .catch((error) => {
        logger.error({ error }, "Failed to log successful study creation audit event");
      });

    res.status(201).json({
      success: true,
      study: {
        id: studyData.id,
        title,
        description,
        maxParticipants,
        durationDays,
        eligibilityCriteria,
        status: "draft",
        stats: {
          enabledCriteriaCount: enabledCount,
          complexity,
          criteriaHash,
        },
        templateName: actualTemplateName,
        createdAt: studyData.created_at,
      },
    });
  } catch (error) {
    logger.error({ error }, "Study creation error");

    auditService
      .logStudyCreation(creatorAddress || "unknown", "unknown", false, {
        reason: "unexpected_error",
        error: error instanceof Error ? error.message : "unknown_error",
        userAgent,
        ipAddress,
        duration: getAuditDuration(startTime),
      })
      .catch((auditError) => {
        logger.error({ auditError }, "Failed to log study creation audit event");
      });

    res.status(500).json({ error: "Internal server error" });
  }
};

export const deployStudy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Study ID is required" });
    }

    const studyId = Number.parseInt(id);

    if (isNaN(studyId)) {
      return res.status(400).json({ error: "Invalid study ID" });
    }

    const { data: study, error: fetchError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select("*")
      .eq(TABLES.STUDIES!.columns.id!, studyId)
      .single();

    if (fetchError || !study) {
      return res.status(404).json({ error: "Study not found" });
    }

    if (study.status === "active" || study.deployment_tx_hash) {
      return res.status(400).json({ error: "Study already deployed" });
    }

    await req.supabase
      .from(TABLES.STUDIES!.name)
      .update({ status: "deploying" })
      .eq(TABLES.STUDIES!.columns.id!, studyId);

    logger.info({ studyId, title: study.title }, "Starting blockchain deployment");

    let parsedCriteria = study.criteria_json;
    if (typeof study.criteria_json === "string") {
      try {
        parsedCriteria = JSON.parse(study.criteria_json);
      } catch (error) {
        logger.error(
          { error, studyId, criteriaJson: study.criteria_json },
          "Failed to parse criteria JSON"
        );
        return res.status(400).json({ error: "Invalid criteria JSON format" });
      }
    }

    logger.info({ studyId, parsedCriteria }, "Parsed criteria for deployment");

    let studyService;
    try {
      const imported = await import("@/services/studyService");
      studyService = imported.studyService;
      logger.info("Study service imported successfully");
    } catch (importError) {
      logger.error(
        {
          importError,
          message: importError instanceof Error ? importError.message : "Unknown error",
          stack: importError instanceof Error ? importError.stack : undefined,
        },
        "Failed to import study service"
      );
      return res.status(500).json({
        error: "Failed to load study service",
        details: importError instanceof Error ? importError.message : String(importError),
      });
    }

    logger.info("Calling deployStudy method");
    const deploymentResult = await studyService.deployStudy({
      title: study.title,
      description: study.description || "",
      maxParticipants: study.max_participants,
      startDate: Math.floor(Date.now() / 1000) + 300, // Current timestamp + 5 minutes buffer
      endDate: Math.floor(Date.now() / 1000) + 300 + study.duration_days * 24 * 60 * 60, // Start + duration
      principalInvestigator: study.created_by,
      criteria: parsedCriteria,
    });

    if (!deploymentResult.success) {
      await req.supabase
        .from(TABLES.STUDIES!.name)
        .update({ status: "draft" })
        .eq(TABLES.STUDIES!.columns.id!, studyId);

      return res.status(500).json({
        error: "Blockchain deployment failed",
        details: deploymentResult.error,
      });
    }

    const { error: updateError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .update({
        status: "active",
        deployment_tx_hash: deploymentResult.transactionHash,
        contract_address: deploymentResult.studyAddress,
        deployed_at: new Date().toISOString(),
      })
      .eq(TABLES.STUDIES!.columns.id!, studyId);

    if (updateError) {
      logger.error({ error: updateError, studyId }, "Failed to update study with deployment info");
    }

    logger.info(
      {
        studyId,
        contractAddress: deploymentResult.studyAddress,
        transactionHash: deploymentResult.transactionHash,
      },
      "Study deployed successfully"
    );

    res.status(200).json({
      success: true,
      deployment: {
        studyId: deploymentResult.studyId,
        contractAddress: deploymentResult.studyAddress,
        transactionHash: deploymentResult.transactionHash,
        gasUsed: deploymentResult.gasUsed,
        etherscanUrl: `https://sepolia.etherscan.io/tx/${deploymentResult.transactionHash}`,
      },
    });
  } catch (error) {
    logger.error({ error, studyId: req.params.id }, "Study deployment error");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStudies = async (req: Request, res: Response) => {
  try {
    const { status, template, createdBy, page = 1, limit } = req.query;

    let query = req.supabase
      .from(TABLES.STUDIES!.name)
      .select("*")
      .order(TABLES.STUDIES!.columns.createdAt!, { ascending: false });

    if (status) {
      query = query.eq(TABLES.STUDIES!.columns.status!, status);
    }

    if (template) {
      query = query.eq(TABLES.STUDIES!.columns.templateName!, template);
    }

    if (createdBy) {
      query = query.eq(TABLES.STUDIES!.columns.createdBy!, createdBy);
    }

    if (limit && !createdBy) {
      const offset = (Number(page) - 1) * Number(limit);
      query = query.range(offset, offset + Number(limit) - 1);
    } else if (limit && createdBy) {
      const offset = (Number(page) - 1) * Number(limit);
      query = query.range(offset, offset + Number(limit) - 1);
    }

    const { data: studies, error, count } = await query;

    if (error) {
      logger.error({ error }, "Failed to fetch studies");
      return res.status(500).json({ error: "Failed to fetch studies" });
    }

    const transformedStudies = await Promise.all(
      (studies || []).map(async (study) => {
        study.current_participants = await updateStudyParticipantCount(
          req.supabase,
          study.id,
          study
        );
        return transformStudyForResponse(study);
      })
    );

    res.json({
      studies: transformedStudies,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: count || 0,
        totalPages: Math.ceil((count || 0) / Number(limit)),
      },
    });
  } catch (error) {
    logger.error({ error }, "Get studies error");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStudyById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const { data: study, error } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select("*")
      .eq(TABLES.STUDIES!.columns.id!, id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ error: "Study not found" });
      }
      logger.error({ error }, "Failed to fetch study");
      return res.status(500).json({ error: "Failed to fetch study" });
    }

    const activeCount = await updateStudyParticipantCount(req.supabase, study.id, study);
    study.current_participants = activeCount;

    res.json({
      study: {
        id: study.id,
        title: study.title,
        description: study.description,
        maxParticipants: study.max_participants,
        currentParticipants: study.current_participants,
        durationDays: study.duration_days,
        status: study.status,
        eligibilityCriteria: study.criteria_json,
        contractAddress: study.contract_address,
        deploymentTxHash: study.deployment_tx_hash,
        templateName: study.template_name,
        createdBy: study.created_by,
        createdAt: study.created_at,
        deployedAt: study.deployed_at,
        stats: {
          complexityScore: study.complexity_score,
          criteriaHash: study.criteria_hash,
        },
      },
    });
  } catch (error) {
    logger.error({ error }, "Get study by ID error");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const updateStudy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, contractAddress, deploymentTxHash } = req.body;

    const updates: any = {};

    if (status) updates.status = status;
    if (contractAddress) updates.contract_address = contractAddress;
    if (deploymentTxHash) updates.deployment_tx_hash = deploymentTxHash;

    if (status === "active" && contractAddress) {
      updates.deployed_at = new Date().toISOString();
    }

    const { data: updatedStudy, error } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .update(updates)
      .eq(TABLES.STUDIES!.columns.id!, id)
      .select()
      .single();

    if (error) {
      logger.error({ error }, "Failed to update study");
      return res.status(500).json({ error: "Failed to update study" });
    }

    logger.info({ studyId: id, status, contractAddress }, "Study updated");

    res.json({
      success: true,
      study: updatedStudy,
    });
  } catch (error) {
    logger.error({ error }, "Update study error");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const participateInStudy = async (req: Request, res: Response) => {
  const { startTime, userAgent, ipAddress } = getAuditMetadata(req);

  try {
    const { id } = req.params;
    const {
      participantWallet,
      proofJson,
      publicInputsJson,
      dataCommitment,
      matchedCriteria,
      eligibilityScore,
    } = req.body;

    if (!participantWallet) {
      return res.status(400).json({ error: "Participant wallet address is required" });
    }

    if (!proofJson) {
      return res.status(400).json({ error: "ZK proof is required" });
    }

    if (!dataCommitment) {
      return res.status(400).json({ error: "Data commitment is required" });
    }

    const { data: studyData, error: studyError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select("id, status, max_participants, current_participants, contract_address")
      .eq(TABLES.STUDIES!.columns.id!, id)
      .single();

    logger.info({ data: studyData }, "Fetched study for participation");

    if (studyError || !studyData) {
      return res.status(404).json({ error: "Study not found" });
    }

    if (studyData.status !== "active") {
      return res.status(400).json({ error: "Study is not accepting participants" });
    }

    if (studyData.current_participants >= studyData.max_participants) {
      return res.status(400).json({ error: "Study is full" });
    }

    const { data: existing } = await req.supabase
      .from(TABLES.STUDY_PARTICIPATIONS!.name)
      .select(TABLES.STUDY_PARTICIPATIONS!.columns.id!)
      .eq(TABLES.STUDY_PARTICIPATIONS!.columns.study_id!, id)
      .eq(TABLES.STUDY_PARTICIPATIONS!.columns.participant_wallet!, participantWallet)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Already participated in this study" });
    }

    const participationData = {
      study_id: id,
      participant_wallet: participantWallet,
      proof_json: proofJson,
      public_inputs_json: publicInputsJson,
      data_commitment: dataCommitment,
      matched_criteria: matchedCriteria,
      eligibility_score: eligibilityScore,
      status: proofJson ? "verified" : "pending",
      has_consented: true,
      enrolled_at: new Date().toISOString(),
    };

    const { data: participation, error: participationError } = await req.supabase
      .from(TABLES.STUDY_PARTICIPATIONS!.name)
      .insert(participationData)
      .select()
      .single();

    if (participationError) {
      logger.error({ error: participationError }, "Failed to record participation");
      return res.status(500).json({ error: "Failed to record participation" });
    }

    await req.supabase
      .from(TABLES.STUDIES!.name)
      .update({ current_participants: studyData.current_participants + 1 })
      .eq(TABLES.STUDIES!.columns.id!, id);

    logger.info({ studyId: id, participantWallet }, "Participant successfully enrolled in study");

    const blockchainTxHash = await studyService.joinBlockchainStudy(
      studyData.contract_address,
      proofJson,
      participantWallet,
      dataCommitment
    );

    await req.supabase
      .from(TABLES.STUDY_PARTICIPATIONS!.name)
      .update({ blockchain_tx_hash: blockchainTxHash })
      .eq(TABLES.STUDY_PARTICIPATIONS!.columns.id!, participation.id);

    await auditService.logStudyParticipation(participantWallet, String(id), true, {
      eligibilityScore,
      matchedCriteria,
      blockchainTxHash,
      dataCommitment: dataCommitment.substring(0, 20) + "...",
      userAgent,
      ipAddress,
      duration: getAuditDuration(startTime),
    });

    res.status(201).json({
      success: true,
      participantId: participation.id,
      studyId: Number(id),
      message: "Successfully enrolled in study",
      participation: {
        id: participation.id,
        status: participation.status,
        eligibilityScore: participation.eligibility_score,
        recordedAt: participation.eligibility_checked_at,
        blockchainTxHash,
      },
    });
  } catch (error) {
    logger.error({ error }, "Participation error");

    const { id } = req.params;
    const { participantWallet } = req.body;
    if (participantWallet && id) {
      await auditService
        .logStudyParticipation(participantWallet, String(id), false, {
          error: error instanceof Error ? error.message : "Unknown error",
          userAgent,
          ipAddress,
          duration: getAuditDuration(startTime),
        })
        .catch((auditError) => {
          logger.error({ auditError }, "Failed to log failed participation attempt");
        });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};

export const deleteStudy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { walletId } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Study ID is required" });
    }

    if (!walletId) {
      return res.status(400).json({ error: "Wallet ID is required" });
    }

    const studyId = Number.parseInt(id);

    if (isNaN(studyId)) {
      return res.status(400).json({ error: "Invalid study ID" });
    }

    const { data: existingStudy, error: fetchError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select("id, title, status, created_by")
      .eq(TABLES.STUDIES!.columns.id!, studyId)
      .single();

    if (fetchError || !existingStudy) {
      return res.status(404).json({ error: "Study not found" });
    }

    if (existingStudy.created_by?.toLowerCase() !== walletId.toLowerCase()) {
      return res.status(403).json({
        error: "Unauthorized",
        details: "Only the study creator can delete this study",
      });
    }

    const { error: deleteError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .delete()
      .eq(TABLES.STUDIES!.columns.id!, studyId);

    if (deleteError) {
      auditService
        .logStudyDeletion(walletId, studyId.toString(), false, {
          studyTitle: existingStudy.title,
          error: deleteError.message,
        })
        .catch((error) => {
          logger.error({ error }, "Failed to log study deletion failure audit event");
        });

      logger.error({ error: deleteError, studyId }, "Failed to delete study");
      return res.status(500).json({ error: "Failed to delete study" });
    }

    auditService
      .logStudyDeletion(walletId, studyId.toString(), true, {
        studyTitle: existingStudy.title,
        previousStatus: existingStudy.status,
      })
      .catch((error) => {
        logger.error({ error }, "Failed to log study deletion audit event");
      });

    logger.info(
      {
        studyId,
        title: existingStudy.title,
      },
      "Study deleted successfully"
    );

    res.status(200).json({
      success: true,
      message: "Study deleted successfully",
      deletedStudyId: studyId,
    });
  } catch (error) {
    logger.error({ error }, "Study deletion error");
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getStudyCriteria = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    logger.info({ studyId: id }, "GET /api/studies/:id/criteria");

    const { data: criteria, error } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select("criteria_json")
      .eq(TABLES.STUDIES!.columns.id!, id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        logger.warn({ studyId: id, errorCode: error.code }, "Study not found");
        return res.status(404).json({ error: "Study not found" });
      }
      logger.error({ error, studyId: id, errorCode: error.code }, "Failed to fetch study criteria");
      return res.status(500).json({ error: "Failed to fetch study criteria" });
    }

    logger.info({ studyId: id }, "Study criteria fetched successfully");

    res.json({ studyCriteria: criteria.criteria_json });
  } catch (error) {
    logger.error(
      {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
        studyId: req.params.id,
      },
      "Get study criteria error"
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getEnrolledStudies = async (req: Request, res: Response) => {
  try {
    const { walletAddress } = req.params;

    logger.info({ walletAddress }, "GET /api/studies/enrolled/:walletAddress");

    const { data: participations, error: participationError } = await req.supabase
      .from(TABLES.STUDY_PARTICIPATIONS!.name)
      .select(
        `${TABLES.STUDY_PARTICIPATIONS!.columns.studyId!}, ${TABLES.STUDY_PARTICIPATIONS!.columns
          .hasConsented!}`
      )
      .eq(TABLES.STUDY_PARTICIPATIONS!.columns.participantWallet!, walletAddress);

    if (participationError) {
      logger.error({ error: participationError, walletAddress }, "Failed to fetch participations");
      return res.status(500).json({ error: "Failed to fetch enrolled studies" });
    }

    if (!participations || participations.length === 0) {
      logger.info({ walletAddress }, "No enrolled studies found");
      return res.json({ studies: [] });
    }

    const studyIds = participations.map((p: any) => p.study_id);

    const consentMap = new Map<number, boolean>();
    participations.forEach((p: any) => {
      consentMap.set(p.study_id, p.has_consented ?? true);
    });

    const { data: studies, error: studiesError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select("*")
      .in(TABLES.STUDIES!.columns.id!, studyIds)
      .order(TABLES.STUDIES!.columns.createdAt!, { ascending: false });

    if (studiesError) {
      logger.error({ error: studiesError, walletAddress }, "Failed to fetch study details");
      return res.status(500).json({ error: "Failed to fetch study details" });
    }

    const transformedStudies =
      studies?.map((study) => transformStudyForResponse(study, true, consentMap.get(study.id))) ||
      [];

    logger.info(
      { walletAddress, count: transformedStudies.length },
      "Enrolled studies fetched successfully"
    );

    res.json({ studies: transformedStudies });
  } catch (error) {
    logger.error(
      {
        error:
          error instanceof Error
            ? {
                message: error.message,
                stack: error.stack,
                name: error.name,
              }
            : error,
        walletAddress: req.params.walletAddress,
      },
      "Get enrolled studies error"
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

export const revokeStudyConsent = async (req: Request, res: Response) => {
  return handleConsentOperation(req, res, "revoke");
};

export const grantStudyConsent = async (req: Request, res: Response) => {
  return handleConsentOperation(req, res, "grant");
};
