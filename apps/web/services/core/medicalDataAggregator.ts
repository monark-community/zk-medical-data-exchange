import { useAccount } from "wagmi";
import { fetchCIDs } from "@/services/api/dataVaultService";
import { processFHIRData, type ExtractedMedicalData } from "@/services/fhir/fhirIntegrationService";
import { ipfsDownload } from "../storage";
import { decryptWithKey } from "@/utils/encryption";
import { getAESKey, addAESKeyToStore } from "@/services/storage";
import { deriveKeyFromWallet } from "@/utils/walletKey";
import { generateAESKey } from "@/utils/encryption";

/**
 * Medical data structure expected by ZK circuits
 */
export interface AggregatedMedicalData {
  age: number;
  gender: number; 
  bmi: number;
  smokingStatus: number; 
  hasHeartDisease: boolean;
  bloodType?: number;
  cholesterol?: number;
  systolicBP?: number;
  diastolicBP?: number;
  hba1c?: number;
  diabetesStatus?: number;
  activityLevel?: number;
  regions?: number[];
}

/**
 * Aggregates medical data from all sources for a given wallet address.
 *
 * @param walletAddress - The wallet address to fetch medical data for.
 * @returns A Promise that resolves to the aggregated medical data in ZK-compatible format, or null if no data is found.
 * @throws Will throw an error if wallet address is missing or if the aggregation process fails.
 */
export const getAggregatedMedicalData = async (walletAddress?: string): Promise<AggregatedMedicalData | null> => {
  if (!walletAddress) {
    throw new Error("Wallet address is required to aggregate medical data");
  }

  try {
    console.log("Retrieving medical data CIDs for wallet:", walletAddress);
    const medicalDataCIDs = await fetchCIDs(walletAddress);
    
    if (medicalDataCIDs.length === 0) {
        console.warn("No medical data found for wallet:", walletAddress);
        //TODO what to do
        return null;
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

    const allFHIRData: any[] = [];
    
    for (const medicalData of medicalDataCIDs) {
      try {
        console.log(`Decrypting FHIR data for CID: ${medicalData.encryptedCid}`);
        const decryptedCid = decryptWithKey(medicalData.encryptedCid, aesKey);
        const content = await ipfsDownload(decryptedCid);
        const fhirData = JSON.parse(content);
        allFHIRData.push(fhirData);
        console.log(`Successfully retrieved and parsed FHIR data for CID: ${medicalData.encryptedCid}`);
      } catch (error) {
        console.error(`Failed to decrypt/retrieve data for CID ${medicalData.encryptedCid}:`, error);
      }
    }

    console.log(`Processing total of ${allFHIRData.length} FHIR resources for aggregation`);

    let consolidatedData: ExtractedMedicalData = {};
    
    for (const fhirResource of allFHIRData) {
      try {
        const extractedData = processFHIRData(fhirResource);
        consolidatedData = { ...consolidatedData, ...extractedData };
      } catch (error) {
        console.error("Failed to process FHIR resource:", error);
      }
    }

    const zkCompatibleData = convertToZKFormat(consolidatedData);

    console.log("Successfully aggregated medical data:", zkCompatibleData);
    return zkCompatibleData;

  } catch (error) {
    console.error("Error aggregating medical data:", error);
    throw new Error(`Failed to aggregate medical data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

/**
 * Converts extracted FHIR data to the format expected by ZK circuits
 */
const convertToZKFormat = (extractedData: ExtractedMedicalData): AggregatedMedicalData => {
  return {
    age: extractedData.age || 30, // Default age if not available
    gender: extractedData.gender || 1, // Default to female if not specified
    bmi: extractedData.bmi || 25.0,
    smokingStatus: extractedData.smokingStatus || 0, // Default to never smoked
    hasHeartDisease: (extractedData.heartDiseaseStatus || 0) > 0,
    
    // Optional fields
    ...(extractedData.bloodType && { bloodType: extractedData.bloodType }),
    ...(extractedData.cholesterol && { cholesterol: extractedData.cholesterol }),
    ...(extractedData.systolicBP && { systolicBP: extractedData.systolicBP }),
    ...(extractedData.diastolicBP && { diastolicBP: extractedData.diastolicBP }),
    ...(extractedData.hba1c && { hba1c: extractedData.hba1c }),
    ...(extractedData.diabetesStatus && { diabetesStatus: extractedData.diabetesStatus }),
    ...(extractedData.activityLevel && { activityLevel: extractedData.activityLevel }),
    ...(extractedData.regions && { regions: extractedData.regions }),
  };
};

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