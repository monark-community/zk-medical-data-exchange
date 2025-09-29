/**
 * Database Schema for Study Management
 * Hybrid approach: DB for performance + blockchain for trust
 */

// ========================================
// STUDIES TABLE SCHEMA
// ========================================

/**
 * SQL Schema for Studies table
 * Run this in your database to create the studies table
 */
export const STUDIES_TABLE_SQL = `
CREATE TABLE public.studies (
  id SERIAL PRIMARY KEY,
  
  -- Basic study info
  title VARCHAR(255) NOT NULL,
  description TEXT,
  max_participants INTEGER NOT NULL DEFAULT 100,
  duration_days INTEGER DEFAULT 365,
  
  -- Blockchain integration
  contract_address VARCHAR(42), -- Ethereum address (0x...)
  deployment_tx_hash VARCHAR(66), -- Transaction hash
  chain_id INTEGER DEFAULT 11155111, -- Sepolia testnet
  
  -- Study criteria (stored for quick queries)
  criteria_json JSONB NOT NULL, -- Full StudyCriteria object
  criteria_hash VARCHAR(64), -- Hash of criteria for verification
  
  -- Quick access fields (denormalized for performance)
  requires_age BOOLEAN DEFAULT FALSE,
  min_age INTEGER,
  max_age INTEGER,
  requires_gender BOOLEAN DEFAULT FALSE,
  allowed_gender INTEGER,
  requires_diabetes BOOLEAN DEFAULT FALSE,
  allowed_diabetes INTEGER,
  
  -- Study status
  status VARCHAR(20) DEFAULT 'draft', -- draft, deploying, active, paused, completed
  current_participants INTEGER DEFAULT 0,
  
  -- Metadata
  created_by VARCHAR(42), -- Creator wallet address
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deployed_at TIMESTAMP,
  
  -- Search optimization
  complexity_score INTEGER DEFAULT 0, -- Number of enabled criteria
  template_name VARCHAR(50), -- If created from template
  
  -- Constraints
  CONSTRAINT valid_status CHECK (status IN ('draft', 'deploying', 'active', 'paused', 'completed'))
);

-- Create indexes separately for better compatibility
CREATE INDEX idx_studies_status ON public.studies (status);
CREATE INDEX idx_studies_created_by ON public.studies (created_by);
CREATE INDEX idx_studies_contract ON public.studies (contract_address);
CREATE INDEX idx_studies_template ON public.studies (template_name);
CREATE INDEX idx_studies_criteria_gin ON public.studies USING gin (criteria_json);
`;

// ========================================
// PARTICIPATION TABLE SCHEMA
// ========================================

export const PARTICIPATION_TABLE_SQL = `
CREATE TABLE public.study_participation (
  id SERIAL PRIMARY KEY,
  
  study_id INTEGER REFERENCES public.studies(id) ON DELETE CASCADE,
  participant_wallet VARCHAR(42) NOT NULL,
  
  -- ZK Proof data
  proof_json JSONB, -- The actual ZK proof
  public_inputs_json JSONB, -- Public inputs used in proof
  verification_tx_hash VARCHAR(66), -- Blockchain verification tx
  
  -- Participation status
  status VARCHAR(20) DEFAULT 'pending', -- pending, verified, rejected
  eligibility_checked_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  
  -- Privacy-preserving eligibility summary (no actual medical data)
  matched_criteria TEXT[], -- Which criteria were matched
  eligibility_score DECIMAL(3,2), -- 0.0 to 1.0 match percentage
  
  -- Constraints
  CONSTRAINT unique_study_participant UNIQUE(study_id, participant_wallet)
);

-- Create indexes separately
CREATE INDEX idx_participation_study ON public.study_participation (study_id);
CREATE INDEX idx_participation_wallet ON public.study_participation (participant_wallet);
CREATE INDEX idx_participation_status ON public.study_participation (status);
`;

// ========================================
// TYPESCRIPT DEFINITIONS
// ========================================

export interface StudyRecord {
  id: number;
  title: string;
  description?: string;
  maxParticipants: number;
  durationDays?: number;

  // Blockchain
  contractAddress?: string;
  deploymentTxHash?: string;
  chainId: number;

  // Criteria
  criteriaJson: any; // StudyCriteria object
  criteriaHash?: string;

  // Quick access
  requiresAge: boolean;
  minAge?: number;
  maxAge?: number;
  requiresGender: boolean;
  allowedGender?: number;
  requiresDiabetes: boolean;
  allowedDiabetes?: number;

  // Status
  status: "draft" | "deploying" | "active" | "paused" | "completed";
  currentParticipants: number;

  // Metadata
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
  deployedAt?: Date;

  complexityScore: number;
  templateName?: string;
}

export interface ParticipationRecord {
  id: number;
  studyId: number;
  participantWallet: string;

  proofJson?: any;
  publicInputsJson?: any;
  verificationTxHash?: string;

  status: "pending" | "verified" | "rejected";
  eligibilityCheckedAt: Date;
  verifiedAt?: Date;

  matchedCriteria?: string[];
  eligibilityScore?: number;
}

// ========================================
// DATABASE TABLE DEFINITIONS
// ========================================

export const STUDIES_TABLE = {
  name: "studies",
  columns: {
    id: "id",
    title: "title",
    description: "description",
    maxParticipants: "max_participants",
    durationDays: "duration_days",
    contractAddress: "contract_address",
    deploymentTxHash: "deployment_tx_hash",
    chainId: "chain_id",
    criteriaJson: "criteria_json",
    criteriaHash: "criteria_hash",
    requiresAge: "requires_age",
    minAge: "min_age",
    maxAge: "max_age",
    requiresGender: "requires_gender",
    allowedGender: "allowed_gender",
    requiresDiabetes: "requires_diabetes",
    allowedDiabetes: "allowed_diabetes",
    status: "status",
    currentParticipants: "current_participants",
    createdBy: "created_by",
    createdAt: "created_at",
    updatedAt: "updated_at",
    deployedAt: "deployed_at",
    complexityScore: "complexity_score",
    templateName: "template_name",
  },
} as const;

export const PARTICIPATION_TABLE = {
  name: "study_participation",
  columns: {
    id: "id",
    studyId: "study_id",
    participantWallet: "participant_wallet",
    proofJson: "proof_json",
    publicInputsJson: "public_inputs_json",
    verificationTxHash: "verification_tx_hash",
    status: "status",
    eligibilityCheckedAt: "eligibility_checked_at",
    verifiedAt: "verified_at",
    matchedCriteria: "matched_criteria",
    eligibilityScore: "eligibility_score",
  },
} as const;
