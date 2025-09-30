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
import { TABLES, getColumns } from "@/constants/db";

/**
 * Create a new medical study (with database storage)
 * POST /studies
 */
export const createStudy = async (req: Request, res: Response) => {
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

    // Use createdBy if provided, otherwise fall back to principalInvestigator
    const creatorAddress = createdBy || principalInvestigator;

    if (!title) {
      return res.status(400).json({ error: "Study title is required" });
    }

    // Determine eligibility criteria
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
      eligibilityCriteria = createCriteria(); // All defaults (disabled)
      logger.info("Creating open study");
    }

    // Validate the criteria
    const validation = validateCriteria(eligibilityCriteria);
    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid study criteria",
        details: validation.errors,
      });
    }

    // Calculate study metrics
    const enabledCount = countEnabledCriteria(eligibilityCriteria);
    const complexity = getStudyComplexity(eligibilityCriteria);
    const criteriaHash = crypto
      .createHash("sha256")
      .update(JSON.stringify(eligibilityCriteria))
      .digest("hex");

    // Extract quick-access criteria fields
    const requiresAge = eligibilityCriteria.enableAge === 1;
    const requiresGender = eligibilityCriteria.enableGender === 1;
    const requiresDiabetes = eligibilityCriteria.enableDiabetes === 1;

    // Save to database using simple field names
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
      chain_id: 11155111, // Sepolia testnet
    };

    const { data: studyData, error: insertError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      logger.error({ error: insertError }, "Failed to create study");
      return res.status(500).json({ error: "Failed to create study" });
    }

    logger.info({ studyId: studyData.id, title }, "Study created successfully");

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
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Deploy study to blockchain
 * POST /studies/:id/deploy
 */
export const deployStudy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ error: "Study ID is required" });
    }

    const studyId = parseInt(id);

    if (isNaN(studyId)) {
      return res.status(400).json({ error: "Invalid study ID" });
    }

    // Get study from database
    const { data: study, error: fetchError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select("*")
      .eq(TABLES.STUDIES!.columns.id!, studyId)
      .single();

    if (fetchError || !study) {
      return res.status(404).json({ error: "Study not found" });
    }

    // Check if already deployed
    if (study.status === "active" || study.deployment_tx_hash) {
      return res.status(400).json({ error: "Study already deployed" });
    }

    // Update status to deploying
    await req.supabase
      .from(TABLES.STUDIES!.name)
      .update({ status: "deploying" })
      .eq(TABLES.STUDIES!.columns.id!, studyId);

    logger.info({ studyId, title: study.title }, "Starting blockchain deployment");

    // Parse criteria JSON if it's a string
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

    // Import blockchain service dynamically to avoid initialization issues
    let blockchainService;
    try {
      const imported = await import("@/services/blockchainService");
      blockchainService = imported.blockchainService;
      logger.info("Blockchain service imported successfully");
    } catch (importError) {
      logger.error(
        {
          importError,
          message: importError instanceof Error ? importError.message : "Unknown error",
          stack: importError instanceof Error ? importError.stack : undefined,
        },
        "Failed to import blockchain service"
      );
      return res.status(500).json({
        error: "Failed to load blockchain service",
        details: importError instanceof Error ? importError.message : String(importError),
      });
    }

    // Deploy to blockchain
    logger.info("Calling deployStudy method");
    const deploymentResult = await blockchainService.deployStudy({
      title: study.title,
      description: study.description || "",
      maxParticipants: study.max_participants,
      startDate: Math.floor(Date.now() / 1000) + 60, // Current timestamp + 60 seconds buffer
      endDate: Math.floor(Date.now() / 1000) + 60 + study.duration_days * 24 * 60 * 60, // Start + duration
      principalInvestigator: study.created_by,
      criteria: parsedCriteria,
    });

    if (!deploymentResult.success) {
      // Update status back to draft on failure
      await req.supabase
        .from(TABLES.STUDIES!.name)
        .update({ status: "draft" })
        .eq(TABLES.STUDIES!.columns.id!, studyId);

      return res.status(500).json({
        error: "Blockchain deployment failed",
        details: deploymentResult.error,
      });
    }

    // Update database with deployment info
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

/**
 * Get all available studies
 * GET /api/studies
 */
export const getStudies = async (req: Request, res: Response) => {
  try {
    const { status, template, page = 1, limit = 20 } = req.query;

    let query = req.supabase
      .from(TABLES.STUDIES!.name)
      .select("*")
      .order(TABLES.STUDIES!.columns.createdAt!, { ascending: false });

    // Apply filters
    if (status) {
      query = query.eq(TABLES.STUDIES!.columns.status!, status);
    }

    if (template) {
      query = query.eq(TABLES.STUDIES!.columns.templateName!, template);
    }

    // Apply pagination
    const offset = (Number(page) - 1) * Number(limit);
    query = query.range(offset, offset + Number(limit) - 1);

    const { data: studies, error, count } = await query;

    if (error) {
      logger.error({ error }, "Failed to fetch studies");
      return res.status(500).json({ error: "Failed to fetch studies" });
    }

    // Transform data for response
    const transformedStudies =
      studies?.map((study) => ({
        id: study.id,
        title: study.title,
        description: study.description,
        maxParticipants: study.max_participants,
        currentParticipants: study.current_participants,
        status: study.status,
        complexityScore: study.complexity_score,
        templateName: study.template_name,
        createdAt: study.created_at,
        contractAddress: study.contract_address,
        // Include quick criteria summary
        criteriasSummary: {
          requiresAge: study.requires_age,
          ageRange: study.requires_age ? `${study.min_age}-${study.max_age}` : null,
          requiresGender: study.requires_gender,
          requiresDiabetes: study.requires_diabetes,
        },
      })) || [];

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

/**
 * Get a specific study by ID
 * GET /api/studies/:id
 */
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

    // Return full study details including criteria
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

/**
 * Update study status (e.g., when deployed to blockchain)
 * PATCH /api/studies/:id
 */
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

/**
 * Record study participation (after ZK proof verification)
 * POST /api/studies/:id/participate
 */
export const participateInStudy = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { participantWallet, proofJson, publicInputsJson, matchedCriteria, eligibilityScore } =
      req.body;

    if (!participantWallet) {
      return res.status(400).json({ error: "Participant wallet address is required" });
    }

    // Check if study exists and is active
    const { data: study, error: studyError } = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select(
        getColumns(TABLES.STUDIES!, ["id", "status", "maxParticipants", "currentParticipants"])
      )
      .eq(TABLES.STUDIES!.columns.id!, id)
      .single();

    if (studyError || !study) {
      return res.status(404).json({ error: "Study not found" });
    }

    // TypeScript type assertion to ensure study is the data object
    const studyData = study as any;

    if (studyData.status !== "active") {
      return res.status(400).json({ error: "Study is not accepting participants" });
    }

    if (studyData.current_participants >= studyData.max_participants) {
      return res.status(400).json({ error: "Study is full" });
    }

    // Check if already participated
    const { data: existing } = await req.supabase
      .from("study_participation")
      .select("id")
      .eq("study_id", id)
      .eq("participant_wallet", participantWallet)
      .single();

    if (existing) {
      return res.status(400).json({ error: "Already participated in this study" });
    }

    // Record participation
    const participationData = {
      study_id: id,
      participant_wallet: participantWallet,
      proof_json: proofJson,
      public_inputs_json: publicInputsJson,
      matched_criteria: matchedCriteria,
      eligibility_score: eligibilityScore,
      status: proofJson ? "verified" : "pending",
    };

    const { data: participation, error: participationError } = await req.supabase
      .from("study_participation")
      .insert(participationData)
      .select()
      .single();

    if (participationError) {
      logger.error({ error: participationError }, "Failed to record participation");
      return res.status(500).json({ error: "Failed to record participation" });
    }

    // Update study participant count
    await req.supabase
      .from("studies")
      .update({ current_participants: studyData.current_participants + 1 })
      .eq("id", id);

    logger.info({ studyId: id, participantWallet }, "Participation recorded");

    res.status(201).json({
      success: true,
      participation: {
        id: participation.id,
        status: participation.status,
        eligibilityScore: participation.eligibility_score,
        recordedAt: participation.eligibility_checked_at,
      },
    });
  } catch (error) {
    logger.error({ error }, "Participation error");
    res.status(500).json({ error: "Internal server error" });
  }
};
