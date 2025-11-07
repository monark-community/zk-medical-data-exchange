import { useAccount } from "wagmi";
import { fetchCIDs } from "@/services/api/dataVaultService";
import { extractFHIRData, validateFHIR } from "@/services/fhir/fhirDataExtractor";
import { decryptWithKey } from "@/utils/encryption";
import { getAESKey, addAESKeyToStore } from "@/services/storage";
import { deriveKeyFromWallet } from "@/utils/walletKey";
import { generateAESKey } from "@/utils/encryption";
import { FHIRDatatype } from "@/services/fhir/types/fhirDatatype";
import { AggregatedMedicalData } from "@/services/fhir/types/aggregatedMedicalData";
import { ipfsDownload } from "../api/ipfsService";

/**
 * Aggregates medical data from all sources for a given wallet address.
 *
 * @param walletAddress - The wallet address to fetch medical data for.
 * @returns A Promise that resolves to the aggregated medical data in ZK-compatible format.
 * @throws Will throw an error if wallet address is missing or if the aggregation process fails.
 */
export const getAggregatedMedicalData = async (walletAddress?: string): Promise<AggregatedMedicalData> => {
  if (!walletAddress) {
    throw new Error("Wallet address is required to aggregate medical data");
  }

  try {
    console.log("Retrieving medical data CIDs for wallet:", walletAddress);
    const medicalDataCIDs = await fetchCIDs(walletAddress);

    if (medicalDataCIDs.length === 0) {
        console.warn("No medical data found for wallet:", walletAddress);
        return {};
    }

    let aesKey = getAESKey(walletAddress);
    if (!aesKey) {
      console.log("AES key not found in cache for wallet:", walletAddress);
      console.log("Deriving new key from wallet...");
      const walletKey = await deriveKeyFromWallet();
      aesKey = generateAESKey(walletKey);
      addAESKeyToStore(aesKey, walletAddress);
      console.log("New AES key stored for wallet:", walletAddress);
    } else {
      console.log("Using cached AES key for wallet:", walletAddress);
    }

    const consolidatedData: AggregatedMedicalData = {};
    const errors: Array<{ cid: string; error: Error }> = [];
    let successCount = 0;
    for (const medicalData of medicalDataCIDs) {
      try {
        const decryptedCid: string = decryptWithKey(medicalData.encryptedCid, aesKey);
        const content: string = await ipfsDownload(decryptedCid);
        const decryptedContent: string = decryptWithKey(content, aesKey);
        const parsed = JSON.parse(decryptedContent);
        validateFHIR(parsed);
        const fhirResource: FHIRDatatype = parsed as FHIRDatatype;
        const aggregatedData: AggregatedMedicalData = extractFHIRData(fhirResource);
        console.log(`Aggregated ressource`, aggregatedData);

        mergeAggregatedData(consolidatedData, aggregatedData);
        successCount++;

      } catch (error) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        errors.push({ cid: medicalData.encryptedCid, error: errorObj });
        console.error(`Failed to decrypt/retrieve data for CID ${medicalData.encryptedCid}:`, errorObj);
      }
    }

    console.log(`Processed ${medicalDataCIDs.length} CIDs: ${successCount} succeeded, ${errors.length} failed`);

    if (errors.length > 0) {
      console.warn("Failed CIDs:", errors.map(e => ({ cid: e.cid, message: e.error.message })));
    }

    if (Object.keys(consolidatedData).length === 0) {
      if (errors.length === medicalDataCIDs.length) {
        throw new Error(
          `Failed to decrypt all medical data records (${errors.length} total). ` +
          `First error: ${errors[0].error.message}`
        );
      }
      console.warn("No valid medical data extracted after processing all FHIR resources");
    }

    return consolidatedData;

  } catch (error) {
    console.error("Error aggregating medical data:", error);
    throw error;
  }
};

/**
 * Intelligently merges two AggregatedMedicalData objects.
 * Prefers values with more recent effectiveDate when conflicts occur.
 */
function mergeAggregatedData(target: AggregatedMedicalData, source: AggregatedMedicalData): void {
  const mergeCodedValue = (
    targetVal: typeof target[keyof AggregatedMedicalData],
    sourceVal: typeof source[keyof AggregatedMedicalData]
  ) => {
    if (!targetVal) return sourceVal;
    if (!sourceVal) return targetVal;

    const targetDate = (targetVal as any).effectiveDate;
    const sourceDate = (sourceVal as any).effectiveDate;

    if (targetDate && sourceDate) {
      return new Date(sourceDate) > new Date(targetDate) ? sourceVal : targetVal;
    }

    if (sourceDate) return sourceVal;
    if (targetDate) return targetVal;

    return sourceVal;
  };

  (Object.keys(source) as Array<keyof AggregatedMedicalData>).forEach(key => {
    if (source[key] !== undefined) {
      if (Array.isArray(source[key])) {
        target[key] = Array.from(new Set([...(target[key] as any[] || []), ...source[key] as any[]])) as any;
      } else if (typeof source[key] === 'object' && source[key] !== null) {
        (target as any)[key] = mergeCodedValue(target[key], source[key]);
      } else {
        (target as any)[key] = source[key];
      }
    }
  });
}

/**
 * Hook version that automatically uses the current wallet address
 * This is the recommended way to use the aggregator in React components
 */
export const useAggregatedMedicalData = () => {
  const { address: walletAddress } = useAccount();

  return {
    aggregateMedicalData: () => getAggregatedMedicalData(walletAddress),
    walletAddress,
  };
};