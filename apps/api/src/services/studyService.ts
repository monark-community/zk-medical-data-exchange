import { createWalletClient, createPublicClient, http, decodeEventLog, keccak256, encodePacked } from "viem";
import { sepolia } from "viem/chains";
import { privateKeyToAccount } from "viem/accounts";
import type { StudyCriteria } from "@zk-medical/shared";
import logger from "@/utils/logger";
import { Config } from "@/config/config";
import { STUDY_ABI, STUDY_FACTORY_ABI, MEDICAL_ELIGIBILITY_VERIFIER_ABI } from "../contracts/generated";

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

export class StudyService {
  private walletClient: any;
  private publicClient: any;
  private account: any;
  private initialized: boolean = false;

  constructor() {
    // Defer initialization until first method call
  }

  private async initialize() {
    if (this.initialized) return;

    // In test mode, skip blockchain initialization
    if (process.env.NODE_ENV === "test") {
      this.initialized = true;
      return;
    }

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

    this.initialized = true;

    logger.info(
      {
        deployer: this.account.address,
        studyFactory: Config.STUDY_FACTORY_ADDRESS,
      },
      "Study service initialized"
    );
  }

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

  public convertToBigIntTuple(
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

  public logConsentResult(
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

  public formatCriteriaForContract(criteria: StudyCriteria) {
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

  async deployStudy(params: StudyDeploymentParams): Promise<StudyDeploymentResult> {
    await this.initialize();

    if (!this.publicClient || !this.walletClient) {
      return { success: false, error: "Blockchain client not initialized" };
    }

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

  async getStudyCount(): Promise<number> {
    await this.initialize();

    if (!this.publicClient) {
      return 0;
    }

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

  async healthCheck(): Promise<{ healthy: boolean; error?: string }> {
    await this.initialize();

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

  /**
   * Register commitment hash on blockchain
   * Called after backend validates signature and before issuing challenge
   *
   * @param contractAddress Study contract address
   * @param participantWallet User's wallet address
   * @param dataCommitment Poseidon hash of medical data
   * @param challenge Random challenge from backend
   * @returns Transaction hash if successful
   */
  async registerCommitmentOnChain(
    contractAddress: string,
    participantWallet: string,
    dataCommitment: string,
    challenge: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    await this.initialize();

    if (!this.publicClient || !this.walletClient) {
      return { success: false, error: "Blockchain client not initialized" };
    }

    try {
      logger.info(
        {
          contractAddress,
          participantWallet,
          dataCommitment: dataCommitment.substring(0, 20) + "...",
          challenge: challenge.substring(0, 20) + "...",
        },
        "Registering commitment on blockchain"
      );

      const challengeBytes32 = challenge.startsWith("0x") ? challenge : `0x${challenge}`;

      const commitmentBigInt = BigInt(dataCommitment);

      const expectedHash = keccak256(
        encodePacked(
          ["address", "uint256", "bytes32"],
          [participantWallet as `0x${string}`, commitmentBigInt, challengeBytes32 as `0x${string}`]
        )
      );

      logger.info(
        {
          participant: participantWallet,
          commitment: commitmentBigInt.toString(),
          challenge: challengeBytes32,
          expectedHash,
        },
        "registerCommitment - values being sent to contract"
      );

      const simulationResult = await this.publicClient.simulateContract({
        account: this.account,
        address: contractAddress as `0x${string}`,
        abi: STUDY_ABI,
        functionName: "registerCommitment",
        // Include participant wallet as third arg per updated contract signature
        args: [commitmentBigInt, challengeBytes32, participantWallet as `0x${string}`],
      });

      logger.info(
        {
          gasEstimate: simulationResult.request.gas?.toString(),
        },
        "Commitment registration simulation successful"
      );

      const transactionHash = await this.walletClient.writeContract(simulationResult.request);

      logger.info({ transactionHash }, "Commitment registration transaction submitted");

      const receipt = await this.publicClient.waitForTransactionReceipt({
        hash: transactionHash,
      });

      if (receipt.status === "reverted") {
        logger.error({ transactionHash }, "Commitment registration transaction reverted");
        throw new Error("Transaction reverted - commitment may already exist");
      }

      logger.info(
        {
          transactionHash,
          gasUsed: receipt.gasUsed.toString(),
          participantWallet,
        },
        "Commitment registered on blockchain successfully"
      );

      return {
        success: true,
        transactionHash,
      };
    } catch (error) {
      logger.error(
        { error, contractAddress, participantWallet },
        "Failed to register commitment on blockchain"
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error registering commitment",
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
    dataCommitment: string,
    challenge: string,
    binIds?: string[],
    publicInputsJson?: string[]
  ) {
    await this.initialize();

    let blockchainTxHash = null;
    if (contractAddress) {
      try {
        const blockchainResult = await this.sendParticipationToBlockchain(
          contractAddress,
          participantWallet,
          proofjson,
          dataCommitment,
          challenge,
          binIds || [],
          publicInputsJson
        );

        if (blockchainResult.success) {
          blockchainTxHash = blockchainResult.transactionHash;
          logger.info(
            {
              participantWallet,
              txHash: blockchainTxHash,
              binCount: binIds?.length || 0,
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
    dataCommitment: string,
    challenge: string,
    binIds: string[] = [],
    publicInputsJson?: string[]
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    await this.initialize();

    logger.info(
      { studyAddress, participantWallet, dataCommitment, proof, binIds },
      "Recording study participation on blockchain"
    );

    let pA: [bigint, bigint];
    let pB: [[bigint, bigint], [bigint, bigint]];
    let pC: [bigint, bigint];
    let commitment: bigint;
    let pubSignals: bigint[] = [];

    try {
      try {
        pA = [BigInt(proof.a[0]), BigInt(proof.a[1])];
        pB = [
          [BigInt(proof.b[0][0]), BigInt(proof.b[0][1])],
          [BigInt(proof.b[1][0]), BigInt(proof.b[1][1])],
        ];
        pC = [BigInt(proof.c[0]), BigInt(proof.c[1])];
        commitment = BigInt(dataCommitment);
      } catch (conversionError) {
        logger.error(
          {
            error: conversionError,
            proof,
            dataCommitment,
          },
          "Failed to convert proof to BigInt"
        );
        throw new Error(
          `Invalid proof format: ${
            conversionError instanceof Error ? conversionError.message : "Unknown error"
          }`
        );
      }

      logger.info({ pA, pB, pC, commitment }, "Proof converted to BigInt format");

      try {
        const r = BigInt("21888242871839275222246405745257275088548364400416034343698204186575808495617");
        const withinField = commitment < r;
        logger.info(
          { commitment: commitment.toString(), withinField },
          "Public signal field bound check (commitment < r)"
        );
      } catch (e) {
        logger.warn(
          { error: e instanceof Error ? e.message : String(e) },
          "Failed field bound check logging"
        );
      }


      // Preflight: verify against the Study's zkVerifier directly to isolate issues
      if (publicInputsJson && publicInputsJson.length > 0) {
        try {
          const zkVerifierAddress = await this.publicClient.readContract({
            address: studyAddress as `0x${string}`,
            abi: STUDY_ABI,
            functionName: "zkVerifier",
          });

          pubSignals = publicInputsJson.map(sig => BigInt(sig));
          
          logger.info(
            { 
              zkVerifierAddress, 
              pubSignalsLength: pubSignals.length,
              dataCommitment: pubSignals[0]?.toString(),
              expectedLength: 51
            },
            "Preparing verifier preflight check"
          );

          if (pubSignals.length !== 51) {
            logger.warn(
              { 
                actualLength: pubSignals.length, 
                expectedLength: 51,
                publicInputsJson 
              },
              "Public signals length mismatch - expected 51 elements"
            );
          } else {
            const verifierOk = await this.publicClient.readContract({
              address: zkVerifierAddress as `0x${string}`,
              abi: MEDICAL_ELIGIBILITY_VERIFIER_ABI,
              functionName: "verifyProof",
              args: [pA, pB, pC, pubSignals],
            });

            logger.info(
              { zkVerifierAddress, verifierOk, dataCommitment: pubSignals[0]?.toString() || 'N/A' },
              "Verifier preflight check result"
            );

            if (!verifierOk) {
              const msg = "Verifier preflight failed: proof/public signal mismatch (check verifier/zkey alignment and dataCommitment)";
              logger.error({ zkVerifierAddress, studyAddress, participantWallet }, msg);
              return { success: false, error: msg };
            }
          }
        } catch (preflightError) {
          logger.warn(
            {
              error: preflightError instanceof Error ? preflightError.message : String(preflightError),
              studyAddress,
              participantWallet,
            },
            "Verifier preflight check encountered an error; continuing to simulateContract"
          );
        }
      } else {
        logger.warn(
          { studyAddress, participantWallet },
          "No publicInputsJson provided - skipping verifier preflight check"
        );
      }

      // In test mode or when clients are not initialized, return failure
      if (!this.publicClient || !this.walletClient) {
        return { success: false, error: "Blockchain client not initialized" };
      }

      let challengeBytes32 = challenge 
        ? (challenge.startsWith('0x') ? challenge : `0x${challenge}`)
        : `0x${'0'.repeat(64)}`; 

      const expectedHash = keccak256(
        encodePacked(
          ["address", "uint256", "bytes32"],
          [participantWallet as `0x${string}`, commitment, challengeBytes32 as `0x${string}`]
        )
      );

      logger.info(
        {
          participant: participantWallet,
          commitment: commitment.toString(),
          challenge: challengeBytes32,
          expectedHash,
          note: "This hash should match what was stored during registerCommitment"
        },
        "joinStudy - values being sent to contract"
      );

      logger.info(
        {
          participantWallet,
          studyAddress,
          binIdsReceived: binIds.length,
        },
        "Processing participant join - preparing bin updates"
      );

      const binMembershipSignals = pubSignals.length >= 51 
        ? pubSignals.slice(0, 50)
        : [];
      
      logger.info(
        {
          participantWallet,
          studyAddress,
          totalBinSlots: binMembershipSignals.length,
          publicSignalsLength: pubSignals.length,
        },
        "Processing participant join - extracting bin membership from proof"
      );
      
      const binsToIncrement: number[] = [];
      binMembershipSignals.forEach((signal, index) => {
        const signalStr = String(signal);
        if (signalStr === "1" || signal === 1n) {
          binsToIncrement.push(index);
        }
      });
      
      logger.info(
        {
          binsToIncrement,
          binCount: binsToIncrement.length,
        },
        `Participant belongs to ${binsToIncrement.length} bins - will increment these on blockchain`
      );

      const binMembershipBigInt = binMembershipSignals.map(signal => BigInt(signal));

      const result = await this.executeContractTransaction(
        studyAddress,
        "joinStudy",
        [pA, pB, pC, commitment, challengeBytes32, participantWallet as `0x${string}`, binMembershipBigInt],
        "Participation recording"
      );

      if (result.success) {
        logger.info(
          { 
            transactionHash: result.transactionHash, 
            participantWallet,
            studyAddress,
            binCount: binsToIncrement.length,
            binsIncremented: binsToIncrement,
          },
          `Participation recorded! ${binsToIncrement.length} bin(s) incremented on blockchain`
        );
        
        binsToIncrement.forEach(binId => {
          logger.info(
            { binId, participant: participantWallet },
            `Bin ${binId} count incremented for participant`
          );
        });
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

  async revokeStudyConsent(
    studyAddress: string,
    participantWallet: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    await this.initialize();

    if (!this.publicClient || !this.walletClient) {
      return { success: false, error: "Blockchain client not initialized" };
    }

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

  async grantStudyConsent(
    studyAddress: string,
    participantWallet: string
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    await this.initialize();

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

  async hasActiveConsent(
    studyAddress: string,
    participantWallet: string
  ): Promise<{ hasConsent: boolean; error?: string }> {
    await this.initialize();

    if (!this.publicClient) {
      return { hasConsent: false };
    }

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

  async isParticipant(
    studyAddress: string,
    participantWallet: string
  ): Promise<{ isParticipant: boolean; error?: string }> {
    try {
      const isParticipant = await this.publicClient.readContract({
        address: studyAddress as `0x${string}`,
        abi: STUDY_ABI,
        functionName: "isParticipant",
        args: [participantWallet as `0x${string}`],
      });

      logger.info(
        {
          studyAddress,
          participantWallet,
          isParticipant,
        },
        "Checked participant status"
      );

      return { isParticipant: Boolean(isParticipant) };
    } catch (error) {
      logger.error(
        { error, studyAddress, participantWallet },
        "Failed to check participant status"
      );
      return {
        isParticipant: false,
        error: error instanceof Error ? error.message : "Unknown error checking participant status",
      };
    }
  }

  async configureBins(
    studyAddress: string,
    bins: Array<{
      binId: string;
      criteriaField: string;
      binType: number;
      label: string;
      minValue: bigint | number;
      maxValue: bigint | number;
      includeMin: boolean;
      includeMax: boolean;
      categoriesBitmap: bigint | number;
    }>
  ): Promise<{ success: boolean; transactionHash?: string; error?: string }> {
    await this.initialize();

    if (!this.publicClient || !this.walletClient) {
      return { success: false, error: "Blockchain client not initialized" };
    }

    try {
      logger.info(
        {
          studyAddress,
          binCount: bins.length,
        },
        "Starting bin configuration on study contract"
      );

      const binsWithBigInt = bins.map((bin, index) => {
        const converted = {
          binId: bin.binId,
          criteriaField: bin.criteriaField,
          binType: bin.binType,
          label: bin.label,
          minValue: BigInt(bin.minValue),
          maxValue: BigInt(bin.maxValue),
          includeMin: bin.includeMin,
          includeMax: bin.includeMax,
          categoriesBitmap: BigInt(bin.categoriesBitmap),
        };
        logger.info(
          {
            index,
            binId: converted.binId,
            field: converted.criteriaField,
            type: converted.binType === 0 ? 'RANGE' : 'CATEGORICAL',
            label: converted.label,
            range: `[${converted.minValue}, ${converted.maxValue}]`,
          },
          `Preparing bin ${index}`
        );
        return converted;
      });

      logger.info({ bins: binsWithBigInt }, "All bins prepared for configuration");
      logger.info(
        { walletAddress: this.walletClient.account.address },
        "Wallet client account address"
      );
      logger.info(
        { walletAddress: this.account.address },
        "Deployer account address"
      );
      logger.info(
        { factoryAddress: Config.STUDY_FACTORY_ADDRESS },
        "Factory address (studyCreator)"
      );

      const result = await this.executeContractTransaction(
        studyAddress,
        "configureBins",
        [binsWithBigInt, Config.STUDY_FACTORY_ADDRESS as `0x${string}`],
        "Bin configuration"
      );

      if (result.success) {
        logger.info(
          {
            transactionHash: result.transactionHash,
            studyAddress,
            binCount: bins.length,
          },
          "Bins configured successfully on blockchain"
        );
        
        bins.forEach((bin, index) => {
          logger.info(
            {
              index,
              binId: bin.binId,
              field: bin.criteriaField,
              label: bin.label,
            },
            `Bin ${index} now active on blockchain`
          );
        });
      } else {
        logger.error(
          {
            error: result.error,
            studyAddress,
            binCount: bins.length,
          },
          "Failed to configure bins"
        );
      }

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
          binCount: bins.length,
        },
        "Exception in configureBins"
      );
      return {
        success: false,
        error: errorMessage,
      };
    }
  }
}

export const studyService = new StudyService();
