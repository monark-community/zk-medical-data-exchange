import type { Request, Response } from "express";
import logger from "@/utils/logger";
import { TABLES } from "@/constants/db";
import { createPublicClient, http, parseEther } from "viem";
import { sepolia } from "viem/chains";
import { Config } from "@/config/config";

const RPC_URL = Config.SEPOLIA_RPC_URL;
const perHeadEth = 0.001;
const perHeadWei = parseEther(String(perHeadEth));

const publicClient = createPublicClient({
  chain: sepolia,
  transport: http(RPC_URL),
});

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

    console.log("Study data:", study.data);

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

    let payloads = [];
    for (const participant of participantsData) {
      const insertPayload: Record<string, any> = {
        [TABLES.TRANSACTIONS!.columns.transactionHash!]: transactionHash,
        [TABLES.TRANSACTIONS!.columns.fromWallet!]: tx.from,
        [TABLES.TRANSACTIONS!.columns.toWallet!]: participant.participant_wallet,
        [TABLES.TRANSACTIONS!.columns.studyId!]: studyId,
        [TABLES.TRANSACTIONS!.columns.value!]: perHeadEth,
      };
      payloads.push(insertPayload);
    }

    await req.supabase.from(TABLES.TRANSACTIONS!.name).insert(payloads);

    await req.supabase
      .from(TABLES.STUDIES!.name)
      .update({ [TABLES.STUDIES!.columns.status!]: "completed" })
      .eq(TABLES.STUDIES!.columns.id!, studyId);

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
