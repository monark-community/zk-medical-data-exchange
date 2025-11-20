import type { Hash, PublicClient } from "viem";
import { randomBytes } from "crypto";
import logger from "@/utils/logger";

const GWEI = 1_000_000_000n;
const DEFAULT_MAX_FEE = 40n * GWEI;
const MAX_MEMORY_SAMPLES = 10;
const SLOW_CONFIRMATION_MS = 60_000;
const VERY_SLOW_CONFIRMATION_MS = 90_000;
const GAS_STATS_LOG_INTERVAL_MS = 30_000;

export const FAST_TX_TIMEOUT_MS = 60_000;
export const FAST_TX_POLL_INTERVAL_MS = 500;
export const FAST_TX_MAX_RETRIES = 5;

interface GasSample {
  priorityFee?: bigint;
  maxFee?: bigint;
  confirmationMs: number;
  timestamp: number;
  context?: string;
}

interface GasMemoryStats {
  medianPriorityFee?: bigint;
  medianMaxFee?: bigint;
  medianConfirmationMs?: number;
}

class GasMemory {
  private samples: GasSample[] = [];

  add(sample: GasSample) {
    this.samples.push(sample);
    if (this.samples.length > MAX_MEMORY_SAMPLES) {
      this.samples.shift();
    }
  }

  getStats(): GasMemoryStats {
    if (this.samples.length === 0) {
      return {};
    }

    const priorityValues = this.samples
      .map((s) => s.priorityFee)
      .filter((v): v is bigint => typeof v === "bigint");
    const maxFeeValues = this.samples
      .map((s) => s.maxFee)
      .filter((v): v is bigint => typeof v === "bigint");
    const confirmationValues = this.samples.map((s) => s.confirmationMs).filter((v) => v > 0);

    return {
      medianPriorityFee: this.medianBigInt(priorityValues),
      medianMaxFee: this.medianBigInt(maxFeeValues),
      medianConfirmationMs: this.medianNumber(confirmationValues),
    };
  }

  reset() {
    this.samples = [];
  }

  getSampleCount() {
    return this.samples.length;
  }

  private medianBigInt(values: bigint[]): bigint | undefined {
    if (!values.length) return undefined;
    const sorted = [...values].sort((a, b) => (a < b ? -1 : 1));
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1]! + sorted[mid]!) / 2n;
    }
    return sorted[mid];
  }

  private medianNumber(values: number[]): number | undefined {
    if (!values.length) return undefined;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1]! + sorted[mid]!) / 2;
    }
    return sorted[mid]!;
  }
}

const gasMemory = new GasMemory();
let lastStatsLog = 0;

export function recordGasObservation(sample: GasSample) {
  gasMemory.add(sample);
  logSlowSample(sample);
  maybeLogGasStats(sample.context);
}

export function getGasMemoryStats() {
  return gasMemory.getStats();
}

function logSlowSample(sample: GasSample) {
  if (sample.confirmationMs >= VERY_SLOW_CONFIRMATION_MS) {
    logger.warn(
      {
        context: sample.context,
        confirmationMs: sample.confirmationMs,
        priorityFeeGwei: convertToGwei(sample.priorityFee),
        maxFeeGwei: convertToGwei(sample.maxFee),
      },
      "Transaction confirmation exceeded 90s threshold"
    );
  } else if (sample.confirmationMs >= SLOW_CONFIRMATION_MS) {
    logger.info(
      {
        context: sample.context,
        confirmationMs: sample.confirmationMs,
        priorityFeeGwei: convertToGwei(sample.priorityFee),
        maxFeeGwei: convertToGwei(sample.maxFee),
      },
      "Transaction confirmation exceeded 60s threshold"
    );
  }
}

function maybeLogGasStats(context?: string) {
  const now = Date.now();
  if (now - lastStatsLog < GAS_STATS_LOG_INTERVAL_MS) {
    return;
  }

  const stats = gasMemory.getStats();
  if (!stats.medianConfirmationMs && !stats.medianPriorityFee && !stats.medianMaxFee) {
    return;
  }

  lastStatsLog = now;
  logger.info(
    {
      triggerContext: context,
      medianConfirmationMs: stats.medianConfirmationMs,
      medianPriorityGwei: convertToGwei(stats.medianPriorityFee),
      medianMaxFeeGwei: convertToGwei(stats.medianMaxFee),
      sampleCount: gasMemory.getSampleCount(),
    },
    "Sepolia gas memory snapshot updated"
  );
}

function convertToGwei(value?: bigint) {
  if (typeof value !== "bigint") {
    return undefined;
  }
  return Number(value) / Number(GWEI);
}

export interface PriorityFeeOptions {
  bumpPercent?: number;
  minPriorityFeeGwei?: number;
}

export async function buildPriorityFeeOverrides(
  client: PublicClient,
  options: PriorityFeeOptions = {}
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
  const memoryStats = getGasMemoryStats();
  const bumpPercent = Math.max(options.bumpPercent ?? 50, 0);
  let multiplier = 100n + BigInt(bumpPercent);
  const minPriority = BigInt(options.minPriorityFeeGwei ?? 5) * GWEI;

  if (memoryStats.medianConfirmationMs) {
    if (memoryStats.medianConfirmationMs > VERY_SLOW_CONFIRMATION_MS) {
      multiplier += 30n;
    } else if (memoryStats.medianConfirmationMs > SLOW_CONFIRMATION_MS) {
      multiplier += 15n;
    }
  }

  let feeData: Awaited<ReturnType<PublicClient["estimateFeesPerGas"]>> | undefined;
  try {
    feeData = await client.estimateFeesPerGas();
  } catch (error) {
    logger.warn(
      { error },
      "Failed to estimate fees, falling back to defaults for fast transaction overrides"
    );
  }

  let basePriority = feeData?.maxPriorityFeePerGas ?? minPriority;
  if (memoryStats.medianPriorityFee && memoryStats.medianPriorityFee > basePriority) {
    basePriority = memoryStats.medianPriorityFee;
  }

  let baseMaxFee = feeData?.maxFeePerGas ?? DEFAULT_MAX_FEE;
  if (memoryStats.medianMaxFee && memoryStats.medianMaxFee > baseMaxFee) {
    baseMaxFee = memoryStats.medianMaxFee;
  }

  const maxPriorityFeePerGas = (basePriority * multiplier) / 100n;
  let maxFeePerGas = (baseMaxFee * multiplier) / 100n;

  const baseFee = isEIP1559FeeData(feeData) ? feeData.baseFeePerGas : GWEI;
  const minBuffer = baseFee * 2n;
  if (maxFeePerGas <= maxPriorityFeePerGas + minBuffer) {
    maxFeePerGas = maxPriorityFeePerGas + minBuffer;
  }

  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
}

function isEIP1559FeeData(
  feeData: any
): feeData is { baseFeePerGas: bigint; maxFeePerGas: bigint; maxPriorityFeePerGas: bigint } {
  return feeData && typeof feeData.baseFeePerGas === "bigint";
}

export async function buildUltraFastFeeOverrides(
  client: PublicClient
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
  return buildPriorityFeeOverrides(client, {
    bumpPercent: 100,
    minPriorityFeeGwei: 10,
  });
}

export async function retryFastTransaction<T>(
  operation: () => Promise<T>,
  context: string,
  maxRetries: number
): Promise<T> {
  let lastError: Error = new Error("Unknown error");

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      logger.debug({ attempt, maxRetries, context }, "Attempting fast transaction");
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (
        lastError.message.includes("insufficient funds") ||
        lastError.message.includes("gas required exceeds allowance") ||
        lastError.message.includes("nonce too low")
      ) {
        throw lastError;
      }

      if (attempt < maxRetries) {
        // Exponential backoff with jitter: 500ms, 1s, 2s, 4s
        const baseDelay = 500 * Math.pow(2, attempt - 1);
        const jitter = (randomBytes(4).readUInt32LE(0) / 0xffffffff) * 200; // Crypto-safe random jitter up to 200ms
        const delay = Math.min(baseDelay + jitter, 5000); // Cap at 5 seconds

        logger.warn(
          {
            error: lastError.message,
            attempt,
            maxRetries,
            delay: Math.round(delay),
            context,
          },
          `Fast transaction attempt ${attempt} failed, retrying`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(`${context} failed after ${maxRetries} attempts: ${lastError.message}`);
}

export interface ReceiptMetrics {
  submittedAt: number;
  priorityFee?: bigint;
  maxFee?: bigint;
  context?: string;
}

export async function waitForReceiptWithTimeout(
  client: PublicClient,
  hash: Hash,
  context: string,
  timeoutMs: number = FAST_TX_TIMEOUT_MS,
  pollingIntervalMs: number = FAST_TX_POLL_INTERVAL_MS,
  metrics?: ReceiptMetrics
) {
  const recordSample = (receipt: any) => {
    if (metrics?.submittedAt) {
      recordGasObservation({
        priorityFee: metrics.priorityFee,
        maxFee: metrics.maxFee,
        confirmationMs: Math.max(0, Date.now() - metrics.submittedAt),
        timestamp: Date.now(),
        context: metrics.context ?? context,
      });
    }
    return receipt;
  };

  try {
    const receipt = await client.waitForTransactionReceipt({
      hash,
      timeout: timeoutMs,
      pollingInterval: pollingIntervalMs,
    });
    return recordSample(receipt);
  } catch (error) {
    const fallbackReceipt = await client
      .getTransactionReceipt({ hash })
      .catch((fallbackError: any) => {
        const fallbackMessage =
          fallbackError instanceof Error ? fallbackError.message.toLowerCase() : "";
        if (
          fallbackMessage.includes("not found") ||
          fallbackMessage.includes("missing") ||
          fallbackMessage.includes("unknown transaction")
        ) {
          return null;
        }
        throw fallbackError;
      });

    if (fallbackReceipt) {
      return recordSample(fallbackReceipt);
    }

    const message =
      error instanceof Error ? error.message : "Unknown error waiting for transaction receipt";

    if (message.toLowerCase().includes("timeout")) {
      throw new Error(`${context} confirmation timed out after ${Math.floor(timeoutMs / 1000)}s`);
    }

    throw error instanceof Error ? error : new Error(message);
  }
}
