import type { Hash, PublicClient } from "viem";
import logger from "@/utils/logger";

const GWEI = 1_000_000_000n;
const DEFAULT_MAX_FEE = 40n * GWEI;

export const FAST_TX_TIMEOUT_MS = 60_000; // Reduced from 120s to 60s for faster failures
export const FAST_TX_POLL_INTERVAL_MS = 500; // Reduced from 1s to 500ms for faster detection
export const FAST_TX_MAX_RETRIES = 5; // Increased from 3 to 5 retries

export interface PriorityFeeOptions {
  bumpPercent?: number;
  minPriorityFeeGwei?: number;
}

export async function buildPriorityFeeOverrides(
  client: PublicClient,
  options: PriorityFeeOptions = {}
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
  // Aggressive defaults for speed - 50% bump and 5 gwei minimum priority
  const bumpPercent = Math.max(options.bumpPercent ?? 50, 0);
  const multiplier = 100n + BigInt(bumpPercent);
  const minPriority = BigInt(options.minPriorityFeeGwei ?? 5) * GWEI;

  let feeData: Awaited<ReturnType<PublicClient["estimateFeesPerGas"]>> | undefined;
  try {
    feeData = await client.estimateFeesPerGas();
  } catch (error) {
    logger.warn(
      { error },
      "Failed to estimate fees, falling back to defaults for fast transaction overrides"
    );
  }

  const basePriority = feeData?.maxPriorityFeePerGas ?? minPriority;
  const baseMaxFee = feeData?.maxFeePerGas ?? DEFAULT_MAX_FEE;

  const maxPriorityFeePerGas = (basePriority * multiplier) / 100n;
  let maxFeePerGas = (baseMaxFee * multiplier) / 100n;

  // Ensure maxFeePerGas is sufficiently higher than maxPriorityFeePerGas for fast inclusion
  // Use a more aggressive buffer for speed
  const baseFee = isEIP1559FeeData(feeData) ? feeData.baseFeePerGas : GWEI;
  const minBuffer = baseFee * 2n; // At least 2x base fee as buffer
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
  // Ultra-aggressive settings for critical transactions
  return buildPriorityFeeOverrides(client, {
    bumpPercent: 100, // Double the estimated fees
    minPriorityFeeGwei: 10, // Minimum 10 gwei priority fee
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

      // Don't retry on certain errors
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
        const jitter = Math.random() * 200; // Add up to 200ms jitter
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

export async function waitForReceiptWithTimeout(
  client: PublicClient,
  hash: Hash,
  context: string,
  timeoutMs: number = FAST_TX_TIMEOUT_MS,
  pollingIntervalMs: number = FAST_TX_POLL_INTERVAL_MS
) {
  try {
    return await client.waitForTransactionReceipt({
      hash,
      timeout: timeoutMs,
      pollingInterval: pollingIntervalMs,
    });
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
      return fallbackReceipt;
    }

    const message =
      error instanceof Error ? error.message : "Unknown error waiting for transaction receipt";

    if (message.toLowerCase().includes("timeout")) {
      throw new Error(`${context} confirmation timed out after ${Math.floor(timeoutMs / 1000)}s`);
    }

    throw error instanceof Error ? error : new Error(message);
  }
}
