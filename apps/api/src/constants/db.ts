/**
 * Represents the structure of a database table.
 *
 * @property name - The name of the table in the database.
 * @property columns - A mapping of logical column keys to their actual database column names.
 */
export type TableDefinition = {
  name: string;
  columns: Record<string, string>;
};

/**
 * Returns a comma-separated string of column names for a given table.
 *
 * @param table - The table definition (with name and columns).
 * @param subset - Optional array of column keys to restrict the result.
 *                 If omitted, all columns in the table will be returned.
 *
 * @returns A string of comma-separated column names suitable for SQL queries.
 */
export const getColumns = (table: TableDefinition, subset?: string[]): string => {
  const keys = subset ?? Object.keys(table.columns);
  return keys.map((k) => table.columns[k]).join(", ");
};

/**
 * Central registry of all database tables and their column mappings.
 *
 * This ensures consistent usage of table and column names across the codebase,
 * and makes it easy to change column names in one place if needed.
 */
export const TABLES: Record<string, TableDefinition> = {
  DATA_VAULT: {
    name: "data_vault",
    columns: {
      id: "id",
      walletAddress: "wallet_address",
      encryptedCid: "encrypted_cid",
      createdAt: "created_at",
      resourceType: "resource_type",
      fileId: "file_id",
    },
  },

  STUDIES: {
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
  },

  STUDY_PARTICIPATIONS: {
    name: "study_participations",
    columns: {
      id: "id",
      studyId: "study_id",
      participantWallet: "participant_wallet",
      proofJson: "proof_json",
      publicInputsJson: "public_inputs_json",
      dataCommitment: "data_commitment",
      verificationTxHash: "verification_tx_hash",
      status: "status",
      eligibilityCheckedAt: "eligibility_checked_at",
      verifiedAt: "verified_at",
      enrolledAt: "enrolled_at",
      matchedCriteria: "matched_criteria",
      eligibilityScore: "eligibility_score",
      consents: "consents",
    },
  },

  USERS: {
    name: "users",
    columns: {
      id: "id",
      username: "username",
      createdAt: "created_at",
    },
  },
};
