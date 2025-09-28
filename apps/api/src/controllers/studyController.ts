import { Request, Response } from "express";
import {
  createCriteria,
  validateCriteria,
  STUDY_TEMPLATES,
  countEnabledCriteria,
  getStudyComplexity,
} from "../../../../packages/shared/studyCriteria";

/**
 * API endpoint to create a new medical study
 * POST /api/studies
 */
export const createStudy = async (req: Request, res: Response) => {
  try {
    const { title, description, maxParticipants, durationDays, templateName, customCriteria } =
      req.body;

    // Option 1: Use a pre-built template
    let eligibilityCriteria;
    if (templateName && STUDY_TEMPLATES[templateName as keyof typeof STUDY_TEMPLATES]) {
      eligibilityCriteria = STUDY_TEMPLATES[templateName as keyof typeof STUDY_TEMPLATES];
      console.log(`📋 Using template: ${templateName}`);
    }
    // Option 2: Create custom criteria (only specify what you want)
    else if (customCriteria) {
      eligibilityCriteria = createCriteria(customCriteria);
      console.log(`🎯 Using custom criteria`);
    }
    // Option 3: Completely open study
    else {
      eligibilityCriteria = createCriteria(); // All defaults (disabled)
      console.log(`🔓 Creating open study`);
    }

    // Validate the criteria
    const validation = validateCriteria(eligibilityCriteria);
    if (!validation.valid) {
      return res.status(400).json({
        error: "Invalid study criteria",
        details: validation.errors,
      });
    }

    // Get study stats
    const enabledCount = countEnabledCriteria(eligibilityCriteria);
    const complexity = getStudyComplexity(eligibilityCriteria);

    console.log(`📊 Study complexity: ${complexity} (${enabledCount}/12 criteria enabled)`);

    // Here you would deploy to blockchain and save to database
    // const deployResult = await deployStudyContract(eligibilityCriteria);

    res.status(201).json({
      success: true,
      study: {
        title,
        description,
        maxParticipants,
        durationDays,
        eligibilityCriteria,
        stats: {
          enabledCriteriaCount: enabledCount,
          complexity,
        },
      },
    });
  } catch (error) {
    console.error("Study creation error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * API endpoint to get available study templates
 * GET /api/studies/templates
 */
export const getStudyTemplates = (req: Request, res: Response) => {
  const templates = Object.keys(STUDY_TEMPLATES).map((key) => ({
    name: key,
    criteria: STUDY_TEMPLATES[key as keyof typeof STUDY_TEMPLATES],
    stats: {
      enabledCount: countEnabledCriteria(STUDY_TEMPLATES[key as keyof typeof STUDY_TEMPLATES]),
      complexity: getStudyComplexity(STUDY_TEMPLATES[key as keyof typeof STUDY_TEMPLATES]),
    },
  }));

  res.json({ templates });
};

/**
 * API endpoint to validate study criteria
 * POST /api/studies/validate
 */
export const validateStudyCriteria = (req: Request, res: Response) => {
  try {
    const { criteria } = req.body;
    const fullCriteria = createCriteria(criteria);
    const validation = validateCriteria(fullCriteria);

    res.json({
      valid: validation.valid,
      errors: validation.errors,
      stats: {
        enabledCount: countEnabledCriteria(fullCriteria),
        complexity: getStudyComplexity(fullCriteria),
      },
    });
  } catch (error) {
    res.status(400).json({ error: "Invalid criteria format" });
  }
};

// ========================================
// EXAMPLE USAGE - Request Bodies
// ========================================

/*
// Example 1: Use a template
POST /api/studies
{
  "title": "Women's Cardiac Health Study",
  "description": "Research on heart disease in women",
  "maxParticipants": 500,
  "durationDays": 730,
  "templateName": "CARDIAC_RESEARCH"
}

// Example 2: Create custom study (age + BMI only)
POST /api/studies  
{
  "title": "Adult BMI Study",
  "maxParticipants": 1000,
  "customCriteria": {
    "enableAge": 1,
    "minAge": 18,
    "maxAge": 65,
    "enableBMI": 1,
    "minBMI": 185,
    "maxBMI": 300
  }
}

// Example 3: Completely open study
POST /api/studies
{
  "title": "Open Demographics Survey", 
  "maxParticipants": 10000
  // No templateName or customCriteria = completely open
}

// Validate criteria before creating
POST /api/studies/validate
{
  "criteria": {
    "enableAge": 1,
    "minAge": 25,
    "maxAge": 20  // ERROR: Invalid range
  }
}
// Response: { "valid": false, "errors": ["Age: minAge must be less than maxAge"] }
*/
