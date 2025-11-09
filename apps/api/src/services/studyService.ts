/**
 * Study Service for API Backend
 * Handles StudyFactory contract interactions on Sepolia testnet
 */

import { createWalletClient, createPublicClient, http, decodeEventLog } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { StudyCriteria } from "@zk-medical/shared";
import logger from "@/utils/logger";
import { Config } from "@/config/config";
import { STUDY_ABI, STUDY_FACTORY_ABI } from "../contracts/generated";

export interface StudyDeploymentParams {
  title: string;
  description: string;
  maxParticipants: number;
  startDate: number;
  endDate: number;
  principalInvestigator: string;
  criteria: StudyCriteria;
}

export interface StudyDeploymentResult {
  success: boolean;
  studyId?: number;
  studyAddress?: string;
  transactionHash?: string;
  gasUsed?: string;
  error?: string;
}

class StudyService {
  private walletClient: any;
  private publicClient: any;
  private account: any;

  constructor() {
    const privateKey = Config.SEPOLIA_PRIVATE_KEY;
    const rpcUrl = Config.SEPOLIA_RPC_URL;

    if (!privateKey) {
      throw new Error("SEPOLIA_PRIVATE_KEY environment variable is required");
    }

    const formattedPrivateKey = privateKey.startsWith("0x") ? privateKey : `0x${privateKey}`;

    if (formattedPrivateKey.length !== 66) {
      throw new Error(
        `Invalid private key format. Expected 64 hex characters, got ${
          formattedPrivateKey.length - 2
        }`
      );
    }

    this.account = privateKeyToAccount(formattedPrivateKey as `0x${string}`);

    this.publicClient = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl),
    });

    this.walletClient = createWalletClient({
      account: this.account,
      chain: sepolia,
      transport: http(rpcUrl),
    });

    logger.info(
      {
        deployer: this.account.address,
        studyFactory: Config.STUDY_FACTORY_ADDRESS,
      },
      "Study service initialized"
    );
  }

  /**
   * Execute a contract transaction with simulation, execution, and receipt handling
   * @private
   */
  private async executeContractTransaction(
    address: string,
    functionName: string,
    args: any[],
    context: string
  ): Promise<{ success: boolean; transactionHash?: string; receipt?: any; error?: string }> {
    try {
      logger.info(
        {
          address,
          functionName,
          args,
          account: this.account.address,
        },
        `${context} - Starting contract call`
      );

      // Simulate the transaction first
      const simulationResult = await this.publicClient.simulateContract({
        account: this.account,
        address: address as `0x${string}`,
        abi: STUDY_ABI,
        functionName,
        args,
      });

      logger.info(
        {
          gasEstimate: simulationResult.request.gas?.toString(),
        },
        `${context} simulation successful`
      );

      const transactionHash = await this.walletClient.writeContract(simulationResult.request);

      logger.info({ transactionHash }, `${context} transaction submitted`);

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: transactionHash,
      });

      if (receipt.status === "reverted") {
        logger.error({ transactionHash }, `${context} transaction reverted`);
        throw new Error(`Transaction reverted - ${context.toLowerCase()} failed`);
      }

      logger.info(
        {
          transactionHash,
          gasUsed: receipt.gasUsed.toString(),
        },
        `${context} completed successfully`
      );

      return {
        success: true,
        transactionHash,
        receipt,
      };
    } catch (error) {
      logger.error(
        {
          error,
          errorMessage: error instanceof Error ? error.message : String(error),
          errorDetails: error instanceof Error ? error.stack : undefined,
          address,
          functionName,
          args,
        },
        `Failed to execute ${context.toLowerCase()}`
      );
      return {
        success: false,
        error:
          error instanceof Error ? error.message : `Unknown error during ${context.toLowerCase()}`,
      };
    }
  }

  /**
   * Helper to convert array of 4 numbers to BigInt tuple
   * @private
   */
  private convertToBigIntTuple(
    arr: readonly number[] | number[] | undefined
  ): [bigint, bigint, bigint, bigint] {
    const defaultArray = [0, 0, 0, 0] as const;
    const source = arr || defaultArray;
    return [
      BigInt(source[0] ?? 0),
      BigInt(source[1] ?? 0),
      BigInt(source[2] ?? 0),
      BigInt(source[3] ?? 0),
    ];
  }

  /**
   * Helper to log consent operation results
   * @private
   */
  private logConsentResult(
    operation: "revoke" | "grant",
    result: { success: boolean; transactionHash?: string; error?: string },
    studyAddress: string,
    participantWallet: string
  ): void {
    if (result.success) {
      logger.info(
        {
          transactionHash: result.transactionHash,
          participantWallet,
        },
        `Consent ${operation === "revoke" ? "revoked" : "granted"} on blockchain successfully`
      );
    } else {
      logger.error(
        { error: result.error, studyAddress, participantWallet },
        `Failed to ${operation} consent on blockchain`
      );
    }
  }

  /**
   * Convert StudyCriteria to contract format
   * Returns object that matches the struct format for viem
   * Uses safe default values for disabled criteria to avoid validation errors
   */
  private formatCriteriaForContract(criteria: StudyCriteria) {
    logger.info({ criteria }, "formatCriteriaForContract called");

    const getSafeRange = (
      enable: number,
      min: number,
      max: number,
      defaultMin: number,
      defaultMax: number
    ) => {
      if (enable === 1) {
        return { min: BigInt(min || defaultMin), max: BigInt(max || defaultMax) };
      }
      return { min: BigInt(defaultMin), max: BigInt(defaultMax) };
    };

    const ageRange = getSafeRange(
      criteria.enableAge || 0,
      criteria.minAge || 0,
      criteria.maxAge || 0,
      0,
      150
    );
    const cholesterolRange = getSafeRange(
      criteria.enableCholesterol || 0,
      criteria.minCholesterol || 0,
      criteria.maxCholesterol || 0,
      0,
      1000
    );
    const bmiRange = getSafeRange(
      criteria.enableBMI || 0,
      criteria.minBMI || 0,
      criteria.maxBMI || 0,
      100,
      800
    );
    const systolicRange = getSafeRange(
      criteria.enableBloodPressure || 0,
      criteria.minSystolic || 0,
      criteria.maxSystolic || 0,
      70,
      250
    );
    const diastolicRange = getSafeRange(
      criteria.enableBloodPressure || 0,
      criteria.minDiastolic || 0,
      criteria.maxDiastolic || 0,
      40,
      150
    );
    const hba1cRange = getSafeRange(
      criteria.enableHbA1c || 0,
      criteria.minHbA1c || 0,
      criteria.maxHbA1c || 0,
      40,
      200
    );
    const activityRange = getSafeRange(
      criteria.enableActivity || 0,
      criteria.minActivityLevel || 0,
      criteria.maxActivityLevel || 0,
      0,
      500
    );

    return {
      enableAge: BigInt(criteria.enableAge || 0),
      minAge: ageRange.min,
      maxAge: ageRange.max,
      enableCholesterol: BigInt(criteria.enableCholesterol || 0),
      minCholesterol: cholesterolRange.min,
      maxCholesterol: cholesterolRange.max,
      enableBMI: BigInt(criteria.enableBMI || 0),
      minBMI: bmiRange.min,
      maxBMI: bmiRange.max,
      enableBloodType: BigInt(criteria.enableBloodType || 0),
      allowedBloodTypes: this.convertToBigIntTuple(criteria.allowedBloodTypes),
      enableGender: BigInt(criteria.enableGender || 0),
      allowedGender: BigInt(criteria.allowedGender || 0),
      enableLocation: BigInt(criteria.enableLocation || 0),
      allowedRegions: this.convertToBigIntTuple(criteria.allowedRegions),
      enableBloodPressure: BigInt(criteria.enableBloodPressure || 0),
      minSystolic: systolicRange.min,
      maxSystolic: systolicRange.max,
      minDiastolic: diastolicRange.min,
      maxDiastolic: diastolicRange.max,
      enableSmoking: BigInt(criteria.enableSmoking || 0),
      allowedSmoking: BigInt(criteria.allowedSmoking || 0),
      enableHbA1c: BigInt(criteria.enableHbA1c || 0),
      minHbA1c: hba1cRange.min,
      maxHbA1c: hba1cRange.max,
      enableActivity: BigInt(criteria.enableActivity || 0),
      minActivityLevel: activityRange.min,
      maxActivityLevel: activityRange.max,
      enableDiabetes: BigInt(criteria.enableDiabetes || 0),
      allowedDiabetes: BigInt(criteria.allowedDiabetes || 0),
      enableHeartDisease: BigInt(criteria.enableHeartDisease || 0),
      allowedHeartDisease: BigInt(criteria.allowedHeartDisease || 0),
    };
  }

  /**
   * Deploy study to StudyFactory contract
   */
  async deployStudy(params: StudyDeploymentParams): Promise<StudyDeploymentResult> {
    try {
      logger.info(
        {
          title: params.title,
          maxParticipants: params.maxParticipants,
        },
        "Starting study deployment"
      );

      let contractCriteria;
      try {
        contractCriteria = this.formatCriteriaForContract(params.criteria);
        logger.info(
          {
            originalCriteria: params.criteria,
            formattedCriteria: contractCriteria,
            formattedCriteriaKeys: Object.keys(contractCriteria),
          },
          "Criteria formatting successful"
        );
      } catch (formatError) {
        logger.error({ formatError, criteria: params.criteria }, "Error formatting criteria");
        throw new Error(
          `Criteria formatting failed: ${
            formatError instanceof Error ? formatError.message : String(formatError)
          }`
        );
      }

      try {
        const openCreation = await this.publicClient.readContract({
          address: Config.STUDY_FACTORY_ADDRESS,
          abi: STUDY_FACTORY_ABI,
          functionName: "openCreation",
        });

        const isAuthorized = await this.publicClient.readContract({
          address: Config.STUDY_FACTORY_ADDRESS,
          abi: STUDY_FACTORY_ABI,
          functionName: "authorizedCreators",
          args: [this.account.address],
        });

        const owner = await this.publicClient.readContract({
          address: Config.STUDY_FACTORY_ADDRESS,
          abi: STUDY_FACTORY_ABI,
          functionName: "owner",
        });

        const zkVerifierCode = await this.publicClient.getCode({
          address: Config.ZK_VERIFIER_ADDRESS as `0x${string}`,
        });

        logger.info(
          {
            deployer: this.account.address,
            openCreation,
            isAuthorized,
            owner,
            isOwner: this.account.address.toLowerCase() === (owner as string).toLowerCase(),
            zkVerifierAddress: Config.ZK_VERIFIER_ADDRESS,
            zkVerifierHasCode: zkVerifierCode && zkVerifierCode !== "0x",
          },
          "Authorization status check"
        );

        if (
          !openCreation &&
          !isAuthorized &&
          this.account.address.toLowerCase() !== (owner as string).toLowerCase()
        ) {
          throw new Error(
            `Not authorized to create studies. Deployer: ${this.account.address}, Owner: ${owner}, OpenCreation: ${openCreation}, IsAuthorized: ${isAuthorized}`
          );
        }
      } catch (authError) {
        logger.error({ authError }, "Failed to check authorization status");
        throw new Error(
          `Authorization check failed: ${
            authError instanceof Error ? authError.message : authError
          }`
        );
      }

      logger.info(
        {
          title: params.title,
          description: params.description,
          maxParticipants: params.maxParticipants,
          startDate: params.startDate,
          endDate: params.endDate,
          principalInvestigator: params.principalInvestigator,
          zkVerifierAddress: Config.ZK_VERIFIER_ADDRESS,
          contractCriteria: contractCriteria,
        },
        "Parameters for createStudy contract call"
      );

      logger.info("Starting contract simulation");

      let request;
      try {
        const simulationResult = await this.publicClient.simulateContract({
          account: this.account,
          address: Config.STUDY_FACTORY_ADDRESS,
          abi: STUDY_FACTORY_ABI,
          functionName: "createStudy",
          args: [
            params.title,
            params.description,
            BigInt(params.maxParticipants),
            BigInt(params.startDate),
            BigInt(params.endDate),
            params.principalInvestigator as `0x${string}`,
            Config.ZK_VERIFIER_ADDRESS as `0x${string}`,
            contractCriteria,
          ],
        });

        request = simulationResult.request;
        logger.info(
          {
            result: simulationResult.result,
            gasEstimate: simulationResult.request.gas?.toString(),
          },
          "Contract simulation successful"
        );
      } catch (simulationError) {
        logger.error(
          {
            simulationError,
            errorMessage:
              simulationError instanceof Error ? simulationError.message : String(simulationError),
          },
          "Contract simulation failed"
        );
        throw new Error(
          `Contract simulation failed: ${
            simulationError instanceof Error ? simulationError.message : String(simulationError)
          }`
        );
      }

      const transactionHash = await this.walletClient.writeContract(request);

      logger.info({ transactionHash }, "Study deployment transaction submitted");

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: transactionHash,
      });

      logger.info(
        {
          receipt: {
            status: receipt.status,
            gasUsed: receipt.gasUsed.toString(),
            logsCount: receipt.logs.length,
          },
        },
        "Transaction receipt received"
      );

      if (receipt.status === "reverted") {
        logger.error(
          {
            transactionHash,
            gasUsed: receipt.gasUsed.toString(),
            blockNumber: receipt.blockNumber?.toString(),
            logs: receipt.logs,
          },
          "Transaction reverted - contract execution failed"
        );
        throw new Error(`Contract execution failed. Transaction reverted: ${transactionHash}`);
      }

      const studyCreatedEvent = receipt.logs.find((log: any) => {
        logger.info(
          {
            logAddress: log.address,
            logTopics: log.topics,
            logData: log.data,
            factoryAddress: Config.STUDY_FACTORY_ADDRESS,
          },
          "Examining log for StudyCreated event"
        );

        try {
          const decoded = decodeEventLog({
            abi: STUDY_FACTORY_ABI,
            data: log.data,
            topics: log.topics,
          });
          logger.info(
            {
              decoded,
              eventName: decoded.eventName,
              args: decoded.args,
            },
            "Successfully decoded event"
          );
          return decoded.eventName === "StudyCreated";
        } catch (decodeError) {
          logger.error(
            {
              decodeError: decodeError instanceof Error ? decodeError.message : decodeError,
              log: {
                address: log.address,
                topics: log.topics,
                data: log.data,
              },
            },
            "Failed to decode log - detailed error"
          );
          return false;
        }
      });

      if (!studyCreatedEvent) {
        logger.error({ logs: receipt.logs }, "StudyCreated event not found in transaction logs");
        throw new Error("StudyCreated event not found in transaction receipt");
      }

      let decodedEvent;
      try {
        decodedEvent = decodeEventLog({
          abi: STUDY_FACTORY_ABI,
          data: studyCreatedEvent.data,
          topics: studyCreatedEvent.topics,
        });
      } catch (eventDecodeError) {
        logger.error(
          { eventDecodeError, studyCreatedEvent },
          "Failed to decode StudyCreated event"
        );
        throw new Error(
          `Failed to decode StudyCreated event: ${
            eventDecodeError instanceof Error ? eventDecodeError.message : eventDecodeError
          }`
        );
      }

      if (decodedEvent.eventName !== "StudyCreated") {
        throw new Error(`Expected StudyCreated event, got ${decodedEvent.eventName}`);
      }

      const studyId = Number((decodedEvent.args as any).studyId);
      const studyAddress = (decodedEvent.args as any).studyContract;

      logger.info({ decodedEvent, studyId, studyAddress }, "Event decoded successfully");

      logger.info(
        {
          transactionHash,
          studyId,
          studyAddress,
          gasUsed: receipt.gasUsed.toString(),
        },
        "Study deployed successfully"
      );

      return {
        success: true,
        studyId,
        studyAddress: studyAddress as string,
        transactionHash,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      logger.error({ error, title: params.title }, "Study deployment failed");

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown deployment error",
      };
    }
  }

  /**
   * Get current study count from contract
   */
  async getStudyCount(): Promise<number> {
    try {
      const count = await this.publicClient.readContract({
        address: Config.STUDY_FACTORY_ADDRESS,
        abi: STUDY_FACTORY_ABI,
        functionName: "studyCount",
      });
      return Number(count);
    } catch (error) {
      logger.error({ error }, "Failed to get study count");
      return 0;
    }
  }

  /**
   * Check if service is properly configured
   */
  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    try {
      await this.getStudyCount();
      return { healthy: true };
    } catch (error) {
      return {
        healthy: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async joinBlockchainStudy(
    contractAddress: string,
    proofjson: {
      a: [string, string];
      b: [[string, string], [string, string]];
      c: [string, string];
    },
    participantWallet: string,
    dataCommitment: string
  ) {
    let blockchainTxHash = null;
    if (contractAddress) {
      try {
        const blockchainResult = await this.sendParticipationToBlockchain(
          contractAddress,
          participantWallet,
          proofjson,
          dataCommitment
        );

        if (blockchainResult.success) {
          blockchainTxHash = blockchainResult.transactionHash;
          logger.info(
            {
              participantWallet,
              txHash: blockchainTxHash,
            },
            "Participation recorded on blockchain successfully"
          );
        } else {
          logger.error(
            {
              error: blockchainResult.error,
              participantWallet,
            },
            "Failed to record participation on blockchain - continuing anyway"
          );
        }
      } catch (blockchainError) {
        logger.error(
          {
            error: blockchainError,
            participantWallet,
          },
          "Error during blockchain participation recording"
        );
      }
    } else {
      logger.info("Study has no blockchain address - skipping blockchain recording");
    }

    return blockchainTxHash;
  }

  async sendParticipationToBlockchain(
    studyAddress: string,
    participantWallet: string,
    proof: { a: [string, string]; b: [[string, string], [string, string]]; c: [string, string] },
    dataCommitment: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    logger.info(
      { studyAddress, participantWallet, dataCommitment, proof },
      "Recording study participation on blockchain"
    );

    try {
      const pA: [bigint, bigint] = [BigInt(proof.a[0]), BigInt(proof.a[1])];
      const pB: [[bigint, bigint], [bigint, bigint]] = [
        [BigInt(proof.b[0][0]), BigInt(proof.b[0][1])],
        [BigInt(proof.b[1][0]), BigInt(proof.b[1][1])],
      ];
      const pC: [bigint, bigint] = [BigInt(proof.c[0]), BigInt(proof.c[1])];
      const commitment = BigInt(dataCommitment);

      logger.info({ pA, pB, pC, commitment }, "Proof converted to BigInt format");

      const result = await this.executeContractTransaction(
        studyAddress,
        "joinStudy",
        [pA, pB, pC, commitment],
        "Participation recording"
      );

      if (result.success) {
        logger.info(
          { transactionHash: result.transactionHash, participantWallet },
          "Participation recorded on blockchain successfully"
        );
      } else {
        logger.error(
          { error: result.error, studyAddress, participantWallet },
          "Failed to record participation on blockchain"
        );
      }

      return {
        success: result.success,
        transactionHash: result.transactionHash,
        error: result.error,
      };
    } catch (conversionError) {
      logger.error(
        { error: conversionError, proof, dataCommitment },
        "Failed to convert proof to BigInt"
      );
      return {
        success: false,
        error: `Invalid proof format: ${
          conversionError instanceof Error ? conversionError.message : "Unknown error"
        }`,
      };
    }
  }

  /**
   * Revoke consent for a study
   * @param studyAddress The address of the study contract
   * @param participantWallet The wallet address of the participant revoking consent
   */
  async revokeStudyConsent(
    studyAddress: string,
    participantWallet: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      logger.info({ studyAddress, participantWallet }, "Revoking study consent on blockchain");

      const result = await this.executeContractTransaction(
        studyAddress,
        "revokeConsent",
        [participantWallet as `0x${string}`],
        "Consent revocation"
      );

      this.logConsentResult("revoke", result, studyAddress, participantWallet);

      return {
        success: result.success,
        transactionHash: result.transactionHash,
        error: result.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        {
          error,
          errorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
          studyAddress,
          participantWallet,
        },
        "Exception in revokeStudyConsent"
      );
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Grant consent for a study (after previously revoking)
   * @param studyAddress The address of the study contract
   * @param participantWallet The wallet address of the participant granting consent
   */
  async grantStudyConsent(
    studyAddress: string,
    participantWallet: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    try {
      logger.info({ studyAddress, participantWallet }, "Granting study consent on blockchain");

      const result = await this.executeContractTransaction(
        studyAddress,
        "grantConsent",
        [participantWallet as `0x${string}`],
        "Consent grant"
      );

      this.logConsentResult("grant", result, studyAddress, participantWallet);

      return {
        success: result.success,
        transactionHash: result.transactionHash,
        error: result.error,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      logger.error(
        {
          error,
          errorMessage,
          errorStack: error instanceof Error ? error.stack : undefined,
          studyAddress,
          participantWallet,
        },
        "Exception in grantStudyConsent"
      );
      return {
        success: false,
        error: errorMessage,
      };
    }
  }

  /**
   * Check if a participant has active consent for a study
   * @param studyAddress The address of the study contract
   * @param participantWallet The wallet address to check
   */
  async hasActiveConsent(
    studyAddress: string,
    participantWallet: string
  ): Promise<{ hasConsent: boolean; error?: string }> {
    try {
      const hasConsent = await this.publicClient.readContract({
        address: studyAddress as `0x${string}`,
        abi: STUDY_ABI,
        functionName: "hasActiveConsent",
        args: [participantWallet as `0x${string}`],
      });

      logger.info(
        {
          studyAddress,
          participantWallet,
          hasConsent,
        },
        "Checked consent status"
      );

      return { hasConsent: Boolean(hasConsent) };
    } catch (error) {
      logger.error({ error, studyAddress, participantWallet }, "Failed to check consent status");
      return {
        hasConsent: false,
        error: error instanceof Error ? error.message : "Unknown error checking consent",
      };
    }
  }
}

export const studyService = new StudyService();
