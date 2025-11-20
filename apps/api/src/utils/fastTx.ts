import type { Hash, PublicClient } from "viem";
import logger from "@/utils/logger";

const GWEI = 1_000_000_000n;
const DEFAULT_MAX_FEE = 40n * GWEI;

export const FAST_TX_TIMEOUT_MS = 120_000;
export const FAST_TX_POLL_INTERVAL_MS = 4_000;

export interface PriorityFeeOptions {
  bumpPercent?: number;
  minPriorityFeeGwei?: number;
}

export async function buildPriorityFeeOverrides(
  client: PublicClient,
  options: PriorityFeeOptions = {}
): Promise<{ maxFeePerGas: bigint; maxPriorityFeePerGas: bigint }> {
  const bumpPercent = Math.max(options.bumpPercent ?? 25, 0);
  const multiplier = 100n + BigInt(bumpPercent);
  const minPriority = BigInt(options.minPriorityFeeGwei ?? 2) * GWEI;

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
  const baseMaxFee =
    feeData?.maxFeePerGas ??
    (feeData && "baseFeePerGas" in feeData && typeof feeData.baseFeePerGas === "bigint"
      ? feeData.baseFeePerGas + basePriority * 2n
      : DEFAULT_MAX_FEE);

  const maxPriorityFeePerGas = (basePriority * multiplier) / 100n;
  let maxFeePerGas = (baseMaxFee * multiplier) / 100n;

  if (maxFeePerGas <= maxPriorityFeePerGas) {
    const buffer =
      feeData && "baseFeePerGas" in feeData && typeof feeData.baseFeePerGas === "bigint"
        ? feeData.baseFeePerGas
        : GWEI;
    maxFeePerGas = maxPriorityFeePerGas + buffer;
  }

  return {
    maxFeePerGas,
    maxPriorityFeePerGas,
  };
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
