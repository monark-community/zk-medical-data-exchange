import type { Request, Response } from "express";
import logger from "@/utils/logger";
import { TABLES } from "@/constants/db";
import { createPublicClient, http, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { Config } from "@/config/config";
import { auditService } from "@/services/auditService";

const RPC_URL = Config.SEPOLIA_RPC_URL;
const perHeadEth = 0.001;
const perHeadWei = parseEther(String(perHeadEth));

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

export const getEthereumPriceUSD = async (): Promise<number> => {
  try {
    const response = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=ethereum&vs_currencies=usd"
    );
    const data = (await response.json()) as { ethereum: { usd: number } };
    return data.ethereum.usd;
  } catch (error: any) {
    const message = error?.response?.data?.error || error.message || "Unknown error";
    throw new Error(`Failed to fetch Ethereum price: ${message}`);
  }
};

export const getTransactionsByStudyId = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const transactions = await req.supabase
      .from(TABLES.TRANSACTIONS!.name)
      .select("*")
      .eq(TABLES.TRANSACTIONS!.columns.studyId!, id);

    if (transactions.error) {
      logger.error({ error: transactions.error }, "Failed to fetch transactions");
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }

    return res.status(200).json({ transactions: transactions.data });
  } catch (error) {
    logger.error({ error, id }, "getTransactionsByStudyId error");
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const getTransactionByWalletAddress = async (req: Request, res: Response) => {
  const { walletAddress } = req.params;

  try {
    const transactions = await req.supabase
      .from(TABLES.TRANSACTIONS!.name)
      .select("*")
      .or(
        `${TABLES.TRANSACTIONS!.columns
          .fromWallet!}.eq.${walletAddress?.toLowerCase()},${TABLES.TRANSACTIONS!.columns
          .toWallet!}.eq.${walletAddress}`
      );

    if (transactions.error) {
      logger.error({ error: transactions.error }, "Failed to fetch transactions");
      return res.status(500).json({ error: "Failed to fetch transactions" });
    }

    return res.status(200).json({ transactions: transactions.data });
  } catch (error) {
    logger.error({ error, walletAddress }, "getTransactionByWalletAddress error");
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyTransaction = async (req: Request, res: Response) => {
  const { studyId, transactionHash } = req.body.data;

  if (!studyId || !transactionHash) {
    return res.status(400).json({ error: "Missing studyId or transactionHash" });
  }

  try {
    const study = await req.supabase
      .from(TABLES.STUDIES!.name)
      .select(
        `${TABLES.STUDIES!.columns.id}, ${TABLES.STUDIES!.columns.createdBy}, ${
          TABLES.STUDIES!.columns.currentParticipants
        }`
      )
      .eq(TABLES.STUDIES!.columns.id!, studyId)
      .single();

    if (study.error || !study.data) {
      logger.error({ error: study.error }, "Study not found");
      return res.status(404).json({ error: "Study not found" });
    }

    const data = study.data as unknown as {
      id: number;
      created_by: string;
      current_participants: number;
    };

    const receipt = await publicClient
      .waitForTransactionReceipt({ hash: transactionHash })
      .catch((e) => {
        logger.warn({ e, transactionHash }, "Receipt not found (tx pending or unknown)");
        return null;
      });

    const tx = await publicClient.getTransaction({ hash: transactionHash }).catch((e) => {
      logger.warn({ e, transactionHash }, "Transaction not found");
      return null;
    });

    if (!tx) {
      return res.status(400).json({ error: "Transaction not found" });
    }

    const expectedTotalWei = perHeadWei * BigInt(data.current_participants);

    let verified = true;
    const reasons: string[] = [];

    if (!receipt) {
      verified = false;
      reasons.push("receipt_missing_or_pending");
    }

    if (receipt && receipt.status !== "success") {
      verified = false;
      reasons.push(`status_${receipt.status}`);
    }

    if (receipt && Number(tx.chainId) !== sepolia.id) {
      verified = false;
      reasons.push(`wrong_chain_${Number(tx.chainId)}_expected_${sepolia.id}`);
    }

    const fromOk = String(tx.from).toLowerCase() === String(data.created_by).toLowerCase();
    if (!fromOk) {
      verified = false;
      reasons.push("sender_mismatch");
    }

    const valueOk = tx.value === expectedTotalWei;
    if (!valueOk) {
      verified = false;
      reasons.push(
        `wrong_value_sent_expected_${expectedTotalWei.toString()}_got_${tx.value.toString()}`
      );
    }

    if (!verified) {
      logger.info({ transactionHash, studyId }, "Transaction verification failed");
      return res.status(200).json({ verified, reasons });
    }

    const participants = await req.supabase
      .from(TABLES.STUDY_PARTICIPATIONS!.name)
      .select(
        `${TABLES.STUDY_PARTICIPATIONS!.columns.studyId}, ${
          TABLES.STUDY_PARTICIPATIONS!.columns.participantWallet
        }`
      )
      .eq(TABLES.STUDY_PARTICIPATIONS!.columns.studyId!, studyId);

    if (participants.error || !participants.data) {
      logger.error({ error: participants.error }, "Failed to fetch study participants");
      return res.status(500).json({ error: "Failed to fetch study participants" });
    }

    const participantsData = participants.data as unknown as {
      study_id: number;
      participant_wallet: string;
    }[];

    const priceUSD = await getEthereumPriceUSD();

    let payloads = [];
    for (const participant of participantsData) {
      const insertPayload: Record<string, any> = {
        [TABLES.TRANSACTIONS!.columns.transactionHash!]: transactionHash,
        [TABLES.TRANSACTIONS!.columns.fromWallet!]: tx.from,
        [TABLES.TRANSACTIONS!.columns.toWallet!]: participant.participant_wallet,
        [TABLES.TRANSACTIONS!.columns.studyId!]: studyId,
        [TABLES.TRANSACTIONS!.columns.value!]: perHeadEth,
        [TABLES.TRANSACTIONS!.columns.valueUSD!]: perHeadEth * priceUSD,
      };
      payloads.push(insertPayload);
    }

    await req.supabase.from(TABLES.TRANSACTIONS!.name).insert(payloads);

    await req.supabase
      .from(TABLES.STUDIES!.name)
      .update({
        [TABLES.STUDIES!.columns.status!]: "completed",
        [TABLES.STUDIES!.columns.transactionHash!]: transactionHash,
      })
      .eq(TABLES.STUDIES!.columns.id!, studyId);

    const participantWallets = participantsData.map((p) => p.participant_wallet);
    auditService.logStudyCompletion(data.created_by, participantWallets, String(studyId), true, {
      transactionHash,
      participantCount: participantsData.length,
      totalEth: perHeadEth * participantsData.length,
      perParticipantEth: perHeadEth,
    });

    // Log compensation sent/received
    auditService.logCompensationSent(
      data.created_by,
      participantWallets,
      true,
      perHeadEth * priceUSD * participantsData.length,
      {
        transactionHash,
        perParticipantUSD: perHeadEth * priceUSD,
        perParticipantEth: perHeadEth,
        totalEth: perHeadEth * participantsData.length,
        ethPriceUSD: priceUSD,
      }
    );

    logger.info({ transactionHash, studyId }, "Transaction verified successfully");

    return res.status(200).json({
      verified,
      reasons,
    });
  } catch (error) {
    logger.error({ error, studyId, transactionHash }, "verifyTransaction error");
    return res.status(500).json({ error: "Internal server error" });
  }
};
