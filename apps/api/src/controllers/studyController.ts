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
import { verifyMessage } from "ethers";
import { createPublicClient, http } from "viem";
import { sepolia } from "viem/chains";
import { Config } from "@/config/config";
import { STUDY_ABI } from "@/contracts/generated";
import { convertBinsForSolidity, validateSolidityBins, formatBinsForLogging } from "@/utils/binConversion";

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

export const fetchParticipantsBlockchain = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Get study contract address from database
    const { data: study, error: studyError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select(TABLES.STUDIES!.columns.contractAddress!)
      .eq(TABLES.STUDIES!.columns.id!, id)
      .single();

    if (studyError || !study) {
      logger.error({ error: studyError, studyId: id }, "Study not found");
      return res.status(404).json({ error: "Study not found" });
    }

    const studyData = study as unknown as { contract_address: string | null };

    if (!studyData.contract_address) {
      logger.warn({ studyId: id }, "Study not deployed to blockchain");
      return res.json({ participants: [] });
    }

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(Config.SEPOLIA_RPC_URL),
    });

    const participants = (await publicClient.readContract({
      address: studyData.contract_address as `0x${string}`,
      abi: STUDY_ABI,
      functionName: "getConsentedParticipants",
    })) as string[];

    logger.info(
      { studyId: id, participantCount: participants.length },
      "Fetched consented participants from blockchain"
    );

    return res.json({
      participants,
    });
  } catch (error) {
    logger.error({ error, studyId: req.params.id }, "Failed to fetch participants from blockchain");
    res.status(500).json({ error: "Internal server error" });
  }
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
    transactionHash: study.transaction_hash,
    complexityScore: study.complexity_score,
    templateName: study.template_name,
    createdAt: study.created_at,
    contractAddress: study.contract_address,
    criteriaSummary: studyCriteriaSummary,
    binConfiguration: study.bin_configuration,
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
      binConfiguration,
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
      bin_configuration: binConfiguration || null,
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

    if (Number.isNaN(studyId)) {
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

    if (study.bin_configuration && deploymentResult.studyAddress) {
      try {
        const solidityBins = convertBinsForSolidity(study.bin_configuration);
        const validation = validateSolidityBins(solidityBins);
        
        if (!validation.isValid) {
          logger.error(
            { errors: validation.errors, studyId },
            "Bin validation failed, skipping configureBins"
          );
        } else {
          logger.info(
            { 
              studyId, 
              contractAddress: deploymentResult.studyAddress,
              binCount: solidityBins.length,
              bins: formatBinsForLogging(solidityBins)
            },
            "Configuring bins on deployed contract"
          );

          const binsForContract = solidityBins.map(bin => ({
            ...bin,
            binId: bin.binId.toString()
          }));

          const binConfigResult = await studyService.configureBins(
            deploymentResult.studyAddress,
            binsForContract
          );
          
          if (binConfigResult.success) {
            logger.info(
              { 
                studyId,
                transactionHash: binConfigResult.transactionHash,
                binCount: solidityBins.length
              },
              "Bins configured successfully on blockchain"
            );
          } else {
            logger.error(
              { error: binConfigResult.error, studyId },
              "Failed to configure bins on blockchain (study deployed but bins not configured)"
            );
          }
        }
      } catch (binError) {
        logger.error(
          { error: binError, studyId },
          "Error during bin configuration (study deployed but bins not configured)"
        );
      }
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
        binConfiguration: study.bin_configuration,
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

export const requestChallenge = async (req: Request, res: Response) => {
  try {
    const { studyId, participantWallet } = req.body;

    if (!studyId) {
      return res.status(400).json({ error: "Study ID is required" });
    }

    if (!participantWallet) {
      return res.status(400).json({ error: "Participant wallet address is required" });
    }

    const { data: studyData, error: studyError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select("id, status")
      .eq(TABLES.STUDIES!.columns.id!, studyId)
      .single();

    if (studyError || !studyData) {
      return res.status(404).json({ error: "Study not found" });
    }

    if (studyData.status !== "active") {
      return res.status(400).json({ error: "Study is not accepting participants" });
    }

    const challenge = crypto.randomBytes(32).toString('hex');

    logger.info(
      { studyId, participantWallet, challenge: challenge.substring(0, 20) + "..." },
      "Generated challenge for participant"
    );

    return res.status(200).json({
      success: true,
      challenge,
      message: "Challenge generated successfully"
    });
  } catch (error) {
    logger.error({ error }, "Request challenge error");
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Generate challenge for data commitment
 * POST /api/studies/data-commitment
 */
export const generateDataCommitmentChallenge = async (req: Request, res: Response) => {
  try {
    const { studyId, participantWallet, dataCommitment, signature, challenge } = req.body;

    if (!studyId) {
      return res.status(400).json({ error: "Study ID is required" });
    }

    if (!participantWallet) {
      return res.status(400).json({ error: "Participant wallet address is required" });
    }

    if (!dataCommitment) {
      return res.status(400).json({ error: "Data commitment is required" });
    }

    if (!signature) {
      return res.status(400).json({ error: "Signature is required" });
    }

    if (!challenge) {
      return res.status(400).json({ error: "Challenge is required" });
    }

    const recoveredAddress = verifyMessage(dataCommitment.toString(), signature);

    if (recoveredAddress.toLowerCase() !== participantWallet.toLowerCase()) {
      return res.status(400).json({ error: "Invalid signature" });
    }

    const { data: studyData, error: studyError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select("id, status, contract_address")
      .eq(TABLES.STUDIES!.columns.id!, studyId)
      .single();

    if (studyError || !studyData) {
      return res.status(404).json({ error: "Study not found" });
    }

    if (studyData.status !== "active") {
      return res.status(400).json({ error: "Study is not accepting participants" });
    }

    const { data: existingCommitment } = await req.supabase
      .from(TABLES.DATA_COMMITMENTS!.name)
      .select("*")
      .eq(TABLES.DATA_COMMITMENTS!.columns.studyId!, studyId)
      .eq(TABLES.DATA_COMMITMENTS!.columns.walletAddress!, participantWallet.toLowerCase())
      .single();

    if (existingCommitment) {
      if (existingCommitment.proof_submitted) {
        return res.status(400).json({
          error: "You have already submitted a proof for this study",
        });
      }

      await req.supabase
        .from(TABLES.DATA_COMMITMENTS!.name)
        .delete()
        .eq(TABLES.DATA_COMMITMENTS!.columns.id!, existingCommitment.id);

      logger.info({ studyId, participantWallet }, "Deleted existing commitment for re-registration");
    }

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours from now

    const { error: commitmentError } = await req.supabase
      .from(TABLES.DATA_COMMITMENTS!.name)
      .insert({
        study_id: studyId,
        wallet_address: participantWallet.toLowerCase(),
        data_commitment: dataCommitment,
        signature: signature,
        challenge: challenge,
        proof_submitted: false,
        expires_at: expiresAt.toISOString(),
      })
      .select()
      .single();

    if (commitmentError) {
      logger.error({ error: commitmentError }, "Failed to store commitment");
      return res.status(500).json({ error: "Failed to generate challenge" });
    }

    logger.info(
      {
        studyId,
        participantWallet,
        dataCommitment: dataCommitment.substring(0, 20) + "...",
        challenge: challenge.substring(0, 20) + "...",
        expiresAt,
      },
      "Generated data commitment challenge - now registering on blockchain"
    );

    if (studyData.contract_address) {
      try {
        const blockchainResult = await studyService.registerCommitmentOnChain(
          studyData.contract_address,
          participantWallet,
          dataCommitment,
          challenge
        );

        if (blockchainResult.success) {
          logger.info(
            {
              txHash: blockchainResult.transactionHash,
              participantWallet,
            },
            "Commitment registered on blockchain"
          );
        } else {
          logger.warn(
            {
              error: blockchainResult.error,
              participantWallet,
            },
            "Failed to register commitment on blockchain - continuing with off-chain only"
          );
        }
      } catch (blockchainError) {
        logger.error(
          { error: blockchainError },
          "Error during blockchain commitment registration - continuing anyway"
        );
      }
    }

    return res.status(200).json({
      success: true,
      challenge,
      expiresAt: expiresAt.toISOString(),
      message: "Challenge generated successfully",
    });
  } catch (error) {
    logger.error({ error }, "Generate data commitment challenge error");
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Record study participation (after ZK proof verification)
 * POST /api/studies/:id/participants
 */
export const participateInStudy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const {
      participantWallet,
      proofJson,
      publicInputsJson,
      dataCommitment,
      matchedCriteria,
      eligibilityScore,
      binIds,
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

    const { data: storedCommitment, error: commitmentFetchError } = await req.supabase
      .from(TABLES.DATA_COMMITMENTS!.name)
      .select("*")
      .eq(TABLES.DATA_COMMITMENTS!.columns.studyId!, id)
      .eq(TABLES.DATA_COMMITMENTS!.columns.walletAddress!, participantWallet.toLowerCase())
      .single();

    logger.info(
      {
        studyId: id,
        participantWallet,
        commitmentFound: !!storedCommitment,
        storedCommitmentPreview: storedCommitment?.data_commitment?.substring(0, 20) + "...",
        receivedCommitmentPreview: dataCommitment?.substring(0, 20) + "..."
      },
      "[PARTICIPATE] Retrieved stored commitment from database"
    );

    if (commitmentFetchError || !storedCommitment) {
      logger.warn(
        { studyId: id, participantWallet },
        "No commitment found - user must request challenge first"
      );
      return res.status(400).json({
        error: "No commitment found. Please request a challenge first.",
        code: "COMMITMENT_NOT_FOUND",
      });
    }

    if (storedCommitment.data_commitment !== dataCommitment) {
      logger.error(
        {
          studyId: id,
          participantWallet,
          submittedPreview: dataCommitment.substring(0, 20) + "...",
          submittedFull: dataCommitment,
          submittedLength: dataCommitment.length,
          storedPreview: storedCommitment.data_commitment.substring(0, 20) + "...",
          storedFull: storedCommitment.data_commitment,
          storedLength: storedCommitment.data_commitment.length,
          areEqual: storedCommitment.data_commitment === dataCommitment,
          typeofSubmitted: typeof dataCommitment,
          typeofStored: typeof storedCommitment.data_commitment
        },
        "[PARTICIPATE] Data commitment MISMATCH - possible tampering detected or bug in commitment generation"
      );
      return res.status(400).json({
        error: "Data commitment does not match stored value",
        code: "COMMITMENT_MISMATCH",
      });
    }

    logger.info(
      { studyId: id, participantWallet },
      "[PARTICIPATE] Commitment verification PASSED - commitments match!"
    );

    if (storedCommitment.proof_submitted) {
      logger.warn(
        { studyId: id, participantWallet },
        "Proof already submitted for this commitment"
      );
      return res.status(400).json({
        error: "Proof already submitted for this study",
        code: "PROOF_ALREADY_SUBMITTED",
      });
    }

    const expiresAt = new Date(storedCommitment.expires_at);
    const now = new Date();

    if (now > expiresAt) {
      logger.warn(
        { studyId: id, participantWallet, expiresAt },
        "Challenge expired - user must request new challenge"
      );
      return res.status(400).json({
        error: "Challenge has expired. Please request a new challenge.",
        code: "CHALLENGE_EXPIRED",
      });
    }

    if (publicInputsJson) {
      try {
        const publicInputs =
          typeof publicInputsJson === "string" ? JSON.parse(publicInputsJson) : publicInputsJson;

        if (publicInputs.challenge && publicInputs.challenge !== storedCommitment.challenge) {
          logger.error(
            { studyId: id, participantWallet },
            "Challenge in proof does not match stored challenge"
          );
          return res.status(400).json({
            error: "Invalid proof: challenge mismatch",
            code: "CHALLENGE_MISMATCH",
          });
        }
      } catch (parseError) {
        logger.error({ parseError }, "Failed to parse public inputs");
      }
    }

    logger.info(
      {
        studyId: id,
        participantWallet,
        commitmentId: storedCommitment.id,
      },
      "Commitment verification passed"
    );

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

    logger.info(
      {
        participantWallet,
        dataCommitment: dataCommitment.substring(0, 20) + "...",
        storedChallenge: storedCommitment.challenge.substring(0, 20) + "...",
      },
      "Calling joinBlockchainStudy with stored challenge"
    );

    const blockchainTxHash = await studyService.joinBlockchainStudy(
      studyData.contract_address,
      proofJson,
      participantWallet,
      dataCommitment,
      storedCommitment.challenge,
      typeof publicInputsJson === "string" ? JSON.parse(publicInputsJson) : publicInputsJson 
    );

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
      enrolled_at: new Date().toISOString()
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

    const { error: commitmentUpdateError } = await req.supabase
      .from(TABLES.DATA_COMMITMENTS!.name)
      .update({
        proof_submitted: true,
        proof_submitted_at: new Date().toISOString(),
      })
      .eq(TABLES.DATA_COMMITMENTS!.columns.id!, storedCommitment.id);

    if (commitmentUpdateError) {
      logger.error(
        { error: commitmentUpdateError, commitmentId: storedCommitment.id },
        "Failed to mark commitment as used"
      );
    } else {
      logger.info(
        { commitmentId: storedCommitment.id, participantWallet },
        "Marked commitment as used - prevents replay attacks"
      );
    }

    await req.supabase
      .from(TABLES.STUDIES!.name)
      .update({ current_participants: studyData.current_participants + 1 })
      .eq(TABLES.STUDIES!.columns.id!, id);

    logger.info({ studyId: id, participantWallet }, "Participant successfully enrolled in study");

    await auditService.logStudyParticipation(participantWallet, String(id), true, {
      blockchainTxHash,
      binCount: binIds?.length || 0,
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

    if (Number.isNaN(studyId)) {
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

export const getAggregatedData = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { creatorWallet } = req.query;

    if (!id) {
      return res.status(400).json({ error: "Study ID is required" });
    }

    logger.info({ studyId: id, creatorWallet }, "GET /api/studies/:id/aggregated-data");

    const { data: study, error: studyError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select("id, title, contract_address, created_by, status, bin_configuration")
      .eq(TABLES.STUDIES!.columns.id!, id)
      .single();

    if (studyError || !study) {
      logger.warn({ studyId: id, error: studyError }, "Study not found");
      return res.status(404).json({ error: "Study not found" });
    }

    if (creatorWallet && study.created_by?.toLowerCase() !== (creatorWallet as string).toLowerCase()) {
      logger.warn(
        { studyId: id, creatorWallet, actualCreator: study.created_by },
        "Unauthorized aggregated data access attempt"
      );
      return res.status(403).json({ error: "Only the study creator can access aggregated data" });
    }

    if (study.status !== "completed" && study.status !== "active") {
      logger.warn({ studyId: id, status: study.status }, "Study not in viewable status");
      return res.status(400).json({ error: "Study must be active or completed to view aggregated data" });
    }

    const studyData = study as { 
      contract_address: string | null; 
      bin_configuration: any;
      title: string;
    };

    if (!studyData.contract_address) {
      logger.warn({ studyId: id }, "Study not deployed to blockchain");
      return res.status(400).json({ error: "Study not deployed to blockchain" });
    }

    const publicClient = createPublicClient({
      chain: sepolia,
      transport: http(Config.SEPOLIA_RPC_URL),
    });

    let bins: any[];
    let binCounts: any[];
    let activeParticipants: bigint;

    try {
      [bins, binCounts, activeParticipants] = await Promise.all([
        publicClient.readContract({
          address: studyData.contract_address as `0x${string}`,
          abi: STUDY_ABI,
          functionName: "getBins",
        }) as Promise<any[]>,
        publicClient.readContract({
          address: studyData.contract_address as `0x${string}`,
          abi: STUDY_ABI,
          functionName: "getAllBinCounts",
        }) as Promise<any[]>,
        publicClient.readContract({
          address: studyData.contract_address as `0x${string}`,
          abi: STUDY_ABI,
          functionName: "getParticipantCount",
        }) as Promise<bigint>,
      ]);
    } catch (blockchainError) {
      logger.error(
        {
          error: blockchainError,
          studyId: id,
          contractAddress: studyData.contract_address,
          errorMessage: blockchainError instanceof Error ? blockchainError.message : String(blockchainError)
        },
        "Failed to fetch data from blockchain"
      );
      return res.status(500).json({ 
        error: "Failed to fetch data from blockchain", 
        details: blockchainError instanceof Error ? blockchainError.message : "Unknown blockchain error"
      });
    }

    logger.info(
      { 
        studyId: id, 
        binsCount: bins.length, 
        binCountsLength: binCounts.length,
        activeParticipants: activeParticipants.toString(),
        rawBinsPreview: bins.slice(0, 2),
        rawBinCountsPreview: binCounts.slice(0, 2)
      },
      "Fetched raw data from blockchain"
    );

    const aggregatedData = {
      studyId: Number(id),
      studyTitle: studyData.title,
      totalParticipants: Number(activeParticipants),
      bins: bins.map((bin: any, index: number) => ({
        binId: bin.binId.toString(),
        criteriaField: bin.criteriaField,
        binType: Number(bin.binType) === 0 ? "RANGE" : "CATEGORICAL",
        label: bin.label,
        minValue: bin.minValue ? Number(bin.minValue) : undefined,
        maxValue: bin.maxValue ? Number(bin.maxValue) : undefined,
        includeMin: bin.includeMin,
        includeMax: bin.includeMax,
        categoriesBitmap: bin.categoriesBitmap ? Number(bin.categoriesBitmap) : undefined,
        count: binCounts[index] ? Number(binCounts[index].count) : 0,
      })),
      generatedAt: Date.now(),
    };

    res.json(aggregatedData);
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
      "Get aggregated data error"
    );
    res.status(500).json({ error: "Internal server error" });
  }
};

export const logStudyDataAccess = async (req: Request, res: Response) => {
  const { startTime, userAgent, ipAddress } = getAuditMetadata(req);

  try {
    const { id } = req.params;
    const { creatorWallet } = req.body;

    if (!id) {
      return res.status(400).json({ error: "Study ID is required" });
    }

    if (!creatorWallet) {
      return res.status(400).json({ error: "Creator wallet address is required" });
    }

    logger.info({ studyId: id, creatorWallet }, "POST /api/studies/:id/data-access");

    // Get study details and participants
    const { data: study, error: studyError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select("id, title, created_by")
      .eq(TABLES.STUDIES!.columns.id!, id)
      .single();

    if (studyError || !study) {
      logger.warn({ studyId: id, error: studyError }, "Study not found for data access logging");
      return res.status(404).json({ error: "Study not found" });
    }

    if (study.created_by?.toLowerCase() !== creatorWallet.toLowerCase()) {
      logger.warn(
        { studyId: id, creatorWallet, actualCreator: study.created_by },
        "Unauthorized data access logging attempt"
      );
      return res.status(403).json({ error: "Only the study creator can log data access" });
    }

    const { data: participants, error: participantsError } = await req.supabase
      .from(TABLES.STUDY_PARTICIPATIONS!.name)
      .select(TABLES.STUDY_PARTICIPATIONS!.columns.participantWallet!)
      .eq(TABLES.STUDY_PARTICIPATIONS!.columns.studyId!, id)
      .eq(TABLES.STUDY_PARTICIPATIONS!.columns.hasConsented!, true);

    if (participantsError) {
      logger.error({ error: participantsError, studyId: id }, "Failed to fetch participants");
      return res.status(500).json({ error: "Failed to fetch participants" });
    }

    const participantAddresses = (participants || []).map((p: any) => p.participant_wallet);

    if (participantAddresses.length === 0) {
      logger.warn({ studyId: id }, "No consented participants found for data access logging");
      return res.status(400).json({ error: "No consented participants found" });
    }

    const auditResult = await auditService.logStudyDataAccess(
      creatorWallet,
      participantAddresses,
      id,
      true,
      {
        studyTitle: study.title,
        participantCount: participantAddresses.length,
        userAgent,
        ipAddress,
        duration: getAuditDuration(startTime),
      }
    );

    if (!auditResult.creatorLog.success) {
      logger.error(
        { error: auditResult.creatorLog.error, studyId: id, creatorWallet },
        "Failed to log study data access for creator"
      );
      return res.status(500).json({
        error: "Failed to log data access",
        details: auditResult.creatorLog.error,
      });
    }

    logger.info(
      {
        studyId: id,
        creatorWallet,
        participantCount: participantAddresses.length,
        txHash: auditResult.creatorLog.txHash,
      },
      "Study data access logged successfully"
    );

    res.status(200).json({
      success: true,
      message: "Data access logged successfully",
      studyId: Number(id),
      participantCount: participantAddresses.length,
      creatorTxHash: auditResult.creatorLog.txHash,
      participantsTxHash: auditResult.participantsLog.txHash,
    });
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
      "Log study data access error"
    );

    const { creatorWallet } = req.body;
    if (creatorWallet && req.params.id) {
      await auditService
        .logStudyDataAccess(creatorWallet, [], req.params.id, false, {
          error: error instanceof Error ? error.message : "Unknown error",
          userAgent,
          ipAddress,
          duration: getAuditDuration(startTime),
        })
        .catch((auditError) => {
          logger.error({ auditError }, "Failed to log failed data access attempt");
        });
    }

    res.status(500).json({ error: "Internal server error" });
  }
};
