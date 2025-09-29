/**
 * StudyFactory Blockchain Service
 * Handles interaction with the StudyFactory smart contract for deploying studies
 */

import { Contract, BrowserProvider, JsonRpcProvider } from "ethers";
import { StudyCriteria } from "@zk-medical/shared";
import { useState, useEffect, useCallback } from "react";

// ========================================
// TYPES & INTERFACES
// ========================================

export interface StudyDeploymentParams {
  title: string;
  description?: string;
  maxParticipants: number;
  startDate?: number; // Unix timestamp
  endDate?: number; // Unix timestamp
  principalInvestigator: string; // Wallet address
  zkVerifierAddress: string; // ZK verifier contract address
  customCriteria: StudyCriteria;
}

export interface DeployedStudy {
  studyId: number;
  studyAddress: string;
  title: string;
  maxParticipants: number;
  principalInvestigator: string;
  isActive: boolean;
  participantCount: number;
  createdAt: number;
  transactionHash: string;
}

export interface StudyFactoryConfig {
  factoryAddress: string;
  chainId: number;
  rpcUrl: string;
  zkVerifierAddress: string;
}

// Default configurations for different networks
export const STUDY_FACTORY_CONFIGS: Record<number, StudyFactoryConfig> = {
  11155111: {
    // Sepolia Testnet
    factoryAddress: process.env.NEXT_PUBLIC_STUDY_FACTORY_ADDRESS_SEPOLIA || "",
    chainId: 11155111,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_SEPOLIA || "https://sepolia.infura.io/v3/",
    zkVerifierAddress: process.env.NEXT_PUBLIC_ZK_VERIFIER_ADDRESS_SEPOLIA || "",
  },
  1: {
    // Ethereum Mainnet
    factoryAddress: process.env.NEXT_PUBLIC_STUDY_FACTORY_ADDRESS_MAINNET || "",
    chainId: 1,
    rpcUrl: process.env.NEXT_PUBLIC_RPC_URL_MAINNET || "https://mainnet.infura.io/v3/",
    zkVerifierAddress: process.env.NEXT_PUBLIC_ZK_VERIFIER_ADDRESS_MAINNET || "",
  },
};

// ========================================
// SMART CONTRACT ABI
// ========================================

const STUDY_FACTORY_ABI = [
  // Events
  "event StudyCreated(uint256 indexed studyId, address indexed studyContract, address indexed principalInvestigator, string title)",

  // Read functions
  "function studyCount() view returns (uint256)",
  "function studies(uint256) view returns (address, string, string, address, uint256, uint256, uint256, uint256, bool)",
  "function openCreation() view returns (bool)",
  "function authorizedCreators(address) view returns (bool)",

  // Write functions - Correct StudyCriteria struct format
  "function createStudy(string memory title, string memory description, uint256 maxParticipants, uint256 startDate, uint256 endDate, address principalInvestigator, address zkVerifierAddress, (uint256 enableAge, uint256 minAge, uint256 maxAge, uint256 enableCholesterol, uint256 minCholesterol, uint256 maxCholesterol, uint256 enableBMI, uint256 minBMI, uint256 maxBMI, uint256 enableBloodType, uint256[4] allowedBloodTypes, uint256 enableGender, uint256 allowedGender, uint256 enableLocation, uint256[4] allowedRegions, uint256 enableBloodPressure, uint256 minSystolic, uint256 maxSystolic, uint256 minDiastolic, uint256 maxDiastolic, uint256 enableHbA1c, uint256 minHbA1c, uint256 maxHbA1c, uint256 enableSmoking, uint256 allowedSmoking, uint256 enableActivity, uint256 minActivityLevel, uint256 maxActivityLevel, uint256 enableDiabetes, uint256 allowedDiabetes, uint256 enableHeartDisease, uint256 allowedHeartDisease) customCriteria) returns (uint256 studyId, address studyAddress)",
];

// ========================================
// BLOCKCHAIN SERVICE CLASS
// ========================================

export class StudyFactoryService {
  private contract: Contract | null = null;
  private provider: BrowserProvider | JsonRpcProvider | null = null;
  private config: StudyFactoryConfig;

  constructor(chainId: number = 11155111) {
    this.config = STUDY_FACTORY_CONFIGS[chainId];
    if (!this.config) {
      throw new Error(`Unsupported chain ID: ${chainId}`);
    }
  }

  /**
   * Initialize the service with Web3 provider
   */
  async initialize(useMetaMask: boolean = true): Promise<void> {
    try {
      if (useMetaMask && typeof window !== "undefined" && (window as any).ethereum) {
        // Use MetaMask or injected provider
        this.provider = new BrowserProvider((window as any).ethereum);

        // Request account access
        await (window as any).ethereum.request({ method: "eth_requestAccounts" });

        // Check if we're on the right network
        const network = await this.provider.getNetwork();
        if (Number(network.chainId) !== this.config.chainId) {
          throw new Error(`Please switch to chain ID ${this.config.chainId}`);
        }
      } else {
        // Use RPC provider (read-only)
        this.provider = new JsonRpcProvider(this.config.rpcUrl);
      }

      // Create contract instance
      this.contract = new Contract(this.config.factoryAddress, STUDY_FACTORY_ABI, this.provider);

      console.log("✅ StudyFactory service initialized");
    } catch (error) {
      console.error("❌ Failed to initialize StudyFactory service:", error);
      throw error;
    }
  }

  /**
   * Deploy a new study to the blockchain
   */
  async deployStudy(params: StudyDeploymentParams): Promise<{
    studyId: number;
    studyAddress: string;
    transactionHash: string;
  }> {
    if (!this.contract || !this.provider) {
      throw new Error("Service not initialized");
    }

    // Get signer for transactions
    const signer = await (this.provider as BrowserProvider).getSigner();
    const contractWithSigner = this.contract.connect(signer) as any;

    try {
      console.log("🚀 Deploying study to blockchain...", params.title);

      // Convert criteria to contract format
      const contractCriteria = this.convertCriteriaToContractFormat(params.customCriteria);

      // Deploy the study
      const tx = await contractWithSigner.createStudy(
        params.title,
        params.description || "",
        params.maxParticipants,
        params.startDate || Math.floor(Date.now() / 1000), // Current time if not provided
        params.endDate || Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60, // 1 year default
        params.principalInvestigator,
        params.zkVerifierAddress || this.config.zkVerifierAddress,
        contractCriteria
      );

      console.log("⏳ Transaction submitted:", tx.hash);

      // Wait for confirmation
      const receipt = await tx.wait();
      console.log("✅ Transaction confirmed:", receipt.hash);

      // Parse the StudyCreated event to get study ID and address
      const studyCreatedEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = this.contract!.interface.parseLog(log);
          return parsedLog?.name === "StudyCreated";
        } catch {
          return false;
        }
      });

      if (!studyCreatedEvent) {
        throw new Error("StudyCreated event not found in transaction receipt");
      }

      const parsedEvent = this.contract.interface.parseLog(studyCreatedEvent);
      if (!parsedEvent) {
        throw new Error("Failed to parse StudyCreated event");
      }

      const studyId = Number(parsedEvent.args.studyId);
      const studyAddress = parsedEvent.args.studyContract;

      console.log("🎉 Study deployed successfully:", { studyId, studyAddress });

      return {
        studyId,
        studyAddress,
        transactionHash: receipt.hash,
      };
    } catch (error: any) {
      console.error("❌ Failed to deploy study:", error);

      // Handle common errors
      if (error.code === "ACTION_REJECTED") {
        throw new Error("Transaction was rejected by user");
      } else if (error.message.includes("Not authorized")) {
        throw new Error("Wallet not authorized to create studies");
      } else if (error.message.includes("Invalid age range")) {
        throw new Error("Invalid age range in study criteria");
      }

      throw new Error(`Deployment failed: ${error.message}`);
    }
  }

  /**
   * Get details of a deployed study by ID
   */
  async getStudyById(studyId: number): Promise<DeployedStudy | null> {
    if (!this.contract) {
      throw new Error("Service not initialized");
    }

    try {
      const studyData = await (this.contract as any).studies(studyId);

      if (studyData[0] === "0x0000000000000000000000000000000000000000") {
        return null; // Study doesn't exist
      }

      return {
        studyId,
        studyAddress: studyData[0], // studyContract
        title: studyData[1], // title
        maxParticipants: Number(studyData[4]), // maxParticipants
        principalInvestigator: studyData[3], // principalInvestigator
        isActive: studyData[8], // active (now at index 8)
        participantCount: 0, // Not directly available from registry
        createdAt: Number(studyData[7]), // createdAt
        transactionHash: "", // Not available from this call
      };
    } catch (error) {
      console.error("Failed to get study:", error);
      return null;
    }
  }

  /**
   * Get all deployed studies
   */
  async getAllStudies(): Promise<DeployedStudy[]> {
    if (!this.contract) {
      throw new Error("Service not initialized");
    }

    try {
      const studyCount = await (this.contract as any).studyCount();

      // Fetch all studies in parallel
      const promises = [];
      for (let i = 0; i < Number(studyCount); i++) {
        promises.push(this.getStudyById(i));
      }

      const results = await Promise.all(promises);

      // Filter out null results
      return results.filter((study): study is DeployedStudy => study !== null);
    } catch (error) {
      console.error("Failed to get all studies:", error);
      return [];
    }
  }

  /**
   * Check if a wallet is authorized to create studies
   */
  async isAuthorizedCreator(walletAddress: string): Promise<boolean> {
    if (!this.contract) {
      throw new Error("Service not initialized");
    }

    try {
      return await (this.contract as any).authorizedCreators(walletAddress);
    } catch (error) {
      console.error("Failed to check authorization:", error);
      return false;
    }
  }

  /**
   * Check if study creation is open to everyone
   */
  async isOpenCreation(): Promise<boolean> {
    if (!this.contract) {
      throw new Error("Service not initialized");
    }

    try {
      return await (this.contract as any).openCreation();
    } catch (error) {
      console.error("Failed to check open creation:", error);
      return false;
    }
  }

  /**
   * Convert StudyCriteria to smart contract format
   * Returns structured object that matches Solidity struct
   */
  private convertCriteriaToContractFormat(criteria: StudyCriteria) {
    return {
      enableAge: criteria.enableAge,
      minAge: criteria.minAge,
      maxAge: criteria.maxAge,
      enableCholesterol: criteria.enableCholesterol,
      minCholesterol: criteria.minCholesterol,
      maxCholesterol: criteria.maxCholesterol,
      enableBMI: criteria.enableBMI,
      minBMI: criteria.minBMI, // Already scaled in shared lib (BMI * 10)
      maxBMI: criteria.maxBMI, // Already scaled in shared lib (BMI * 10)
      enableBloodType: criteria.enableBloodType,
      allowedBloodTypes: criteria.allowedBloodTypes,
      enableGender: criteria.enableGender,
      allowedGender: criteria.allowedGender,
      enableLocation: criteria.enableLocation,
      allowedRegions: criteria.allowedRegions,
      enableBloodPressure: criteria.enableBloodPressure,
      minSystolic: criteria.minSystolic,
      maxSystolic: criteria.maxSystolic,
      minDiastolic: criteria.minDiastolic,
      maxDiastolic: criteria.maxDiastolic,
      enableHbA1c: criteria.enableHbA1c,
      minHbA1c: criteria.minHbA1c, // Already scaled in shared lib (HbA1c * 10)
      maxHbA1c: criteria.maxHbA1c, // Already scaled in shared lib (HbA1c * 10)
      enableSmoking: criteria.enableSmoking,
      allowedSmoking: criteria.allowedSmoking,
      enableActivity: criteria.enableActivity,
      minActivityLevel: criteria.minActivityLevel,
      maxActivityLevel: criteria.maxActivityLevel,
      enableDiabetes: criteria.enableDiabetes,
      allowedDiabetes: criteria.allowedDiabetes,
      enableHeartDisease: criteria.enableHeartDisease,
      allowedHeartDisease: criteria.allowedHeartDisease,
    };
  }
}

// ========================================
// CONVENIENCE FUNCTIONS
// ========================================

/**
 * Create a new StudyFactoryService instance
 */
export const createStudyFactoryService = (chainId: number = 11155111) => {
  return new StudyFactoryService(chainId);
};

/**
 * Quick deployment function for easy use
 */
export const deployStudyToBlockchain = async (
  studyParams: StudyDeploymentParams,
  chainId: number = 11155111
) => {
  const service = createStudyFactoryService(chainId);
  await service.initialize();
  return service.deployStudy(studyParams);
};

// ========================================
// REACT HOOKS
// ========================================

/**
 * React hook for managing StudyFactory service
 */
export const useStudyFactory = (chainId: number = 11155111) => {
  const [service, setService] = useState<StudyFactoryService | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const factoryService = createStudyFactoryService(chainId);
      await factoryService.initialize();

      setService(factoryService);
      setIsInitialized(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [chainId]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const deployStudy = useCallback(
    async (params: StudyDeploymentParams) => {
      if (!service) throw new Error("Service not initialized");

      setIsLoading(true);
      setError(null);

      try {
        return await service.deployStudy(params);
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [service]
  );

  return {
    service,
    isInitialized,
    isLoading,
    error,
    deployStudy,
    initialize,
  };
};
