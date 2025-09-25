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
 *
 * @example
 * getColumns(TABLES.DATA_VAULT);
 * // "id, wallet_address, encrypted_cid, created_at, record_type"
 *
 * @example
 * getColumns(TABLES.DATA_VAULT, ["id", "walletAddress"]);
 * // "id, wallet_address"
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
    },
  },
};
