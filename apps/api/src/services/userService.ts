import type { Request, Response } from "express";
import logger from "@/utils/logger";
import { TABLES } from "@/constants/db";
import type { SupabaseClient } from "@supabase/supabase-js";

const { USERS, STUDY_PARTICIPATIONS, DATA_VAULT, STUDIES } = TABLES;

export type UserRow = {
  id: string;
  username: string | null;
  created_at: string;
};

export async function checkIfUserExists(
  req: Request,
  res: Response,
  walletAddress: string
): Promise<boolean> {
  try {
    logger.info({ walletAddress }, "checkIfUserExists called");

    const { data, error } = await req.supabase
      .from(USERS!.name!)
      .select("*")
      .eq(USERS!.columns.id!, walletAddress)
      .limit(1)
      .single();

    if (error) {
      logger.error({ error, walletAddress }, "Supabase query error in checkIfUserExists");
      res.status(500).json({ error: "Database query failed" });
      return false;
    }

    const exists = !!data;
    logger.info({ walletAddress, exists }, "checkIfUserExists result");

    return exists;
  } catch (err) {
    logger.error({ err, walletAddress }, "Unexpected error in checkIfUserExists");
    res.status(500).json({ error: "Internal server error" });
    return false;
  }
}

export async function createUser(
  req: Request,
  res: Response,
  walletAddress: string
): Promise<boolean> {
  try {
    logger.info({ walletAddress }, "createUser called");

    const { error } = await req.supabase.from(USERS!.name!).insert({
      [USERS!.columns.id!]: walletAddress,
      [USERS!.columns.username!]: walletAddress,
    });

    if (error) {
      logger.error({ error, walletAddress }, "Supabase insert error in createUser");
      res.status(500).json({ error: "Failed to create user" });
      return false;
    }

    logger.info({ walletAddress }, "User created successfully");
    return true;
  } catch (err) {
    logger.error({ err, walletAddress }, "Unexpected error in createUser");
    res.status(500).json({ error: "Internal server error" });
    return false;
  }
}

export async function getUserByWalletAddress(
  supabase: SupabaseClient,
  walletAddress: string
): Promise<UserRow | null> {
  const { data, error } = await supabase
    .from(USERS!.name!)
    .select("id, username, created_at")
    .eq(USERS!.columns.id!, walletAddress)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase query failed: ${error.message}`);
  }

  return data ?? null;
}

export async function updateUserByWalletAddress(
  supabase: SupabaseClient,
  walletAddress: string,
  updateData: { username?: string }
): Promise<UserRow | null> {
  if (updateData.username !== undefined) {
    const username = updateData.username.trim();

    const usernameRegex = /^[a-zA-Z_]{4,10}$/;
    if (!usernameRegex.test(username)) {
      throw new Error(
        "Invalid username format. Must be 4-10 characters long, letters and underscores only."
      );
    }
  }

  const { data, error } = await supabase
    .from(USERS!.name!)
    .update({
      [USERS!.columns.username!]: updateData.username,
    })
    .eq(USERS!.columns.id!, walletAddress)
    .select("id, username, created_at")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to update user: ${error.message}`);
  }

  return data ?? null;
}

export async function getUserStatsForDataSeller(
  supabase: SupabaseClient,
  walletAddress: string
): Promise<{
  nActiveStudies: number;
  nCompletedStudies: number;
  nMedicalFiles: number;
  totalEarnings: number;
}> {
  // Only count participations where user has active consent
  const { data: participations, error: participationsError } = await supabase
    .from(STUDY_PARTICIPATIONS!.name!)
    .select("*, studies!inner(created_at, duration_days)")
    .eq(STUDY_PARTICIPATIONS!.columns.participantWallet!, walletAddress)
    .eq(STUDY_PARTICIPATIONS!.columns.consents!, true);

  if (participationsError) {
    logger.error(
      { error: participationsError, walletAddress },
      "Failed to get study participations"
    );
  }

  const now = new Date();
  let nActiveStudies = 0;
  let nCompletedStudies = 0;

  if (participations) {
    for (const participation of participations) {
      const study = participation.studies as { created_at: string; duration_days: number };
      const createdAt = new Date(study.created_at);
      const endDate = new Date(createdAt);
      endDate.setDate(endDate.getDate() + study.duration_days);

      if (now <= endDate) {
        nActiveStudies++;
      } else {
        nCompletedStudies++;
      }
    }
  }

  const { count: nMedicalFiles, error: medicalError } = await supabase
    .from(DATA_VAULT!.name!)
    .select("*", { count: "exact", head: true })
    .eq(DATA_VAULT!.columns.walletAddress!, walletAddress);

  if (medicalError) {
    logger.error({ error: medicalError, walletAddress }, "Failed to get medical files count");
  }
  // TODO [LT]: Implement when we have this data
  const totalEarnings = 0;

  return {
    nActiveStudies: nActiveStudies ?? 0,
    nCompletedStudies: nCompletedStudies ?? 0,
    nMedicalFiles: nMedicalFiles ?? 0,
    totalEarnings: totalEarnings ?? 0,
  };
}

export async function getUserStatsForResearcher(
  supabase: SupabaseClient,
  walletAddress: string
): Promise<{
  nActiveStudies: number;
  nParticipantsEnrolled: number;
  nCompletedStudies: number;
  totalSpent: number;
}> {
  const { data: studies, error: studiesError } = await supabase
    .from(STUDIES!.name!)
    .select("created_at, duration_days, status")
    .eq(STUDIES!.columns.createdBy!, walletAddress);

  if (studiesError) {
    logger.error({ error: studiesError, walletAddress }, "Failed to get studies");
  }

  const now = new Date();
  let nActiveStudies = 0;
  let nCompletedStudies = 0;

  if (studies) {
    for (const study of studies) {
      const createdAt = new Date(study.created_at);
      const endDate = new Date(createdAt);
      endDate.setDate(endDate.getDate() + study.duration_days);
      if (now <= endDate && study.status === "active") {
        nActiveStudies++;
      } else {
        nCompletedStudies++;
      }
    }
  }

  // Only count participants with active consent
  const { count: nParticipantsEnrolled, error: participantsError } = await supabase
    .from(STUDY_PARTICIPATIONS!.name!)
    .select("*, studies!inner(*)", { count: "exact", head: true })
    .eq("studies.created_by", walletAddress)
    .eq(STUDY_PARTICIPATIONS!.columns.consents!, true);

  if (participantsError) {
    logger.error({ error: participantsError, walletAddress }, "Failed to get participants count");
  }

  // TODO: [LT] Implement when we have payment/budget tracking
  const totalSpent = 0;

  return {
    nActiveStudies: nActiveStudies ?? 0,
    nParticipantsEnrolled: nParticipantsEnrolled ?? 0,
    nCompletedStudies: nCompletedStudies ?? 0,
    totalSpent: totalSpent ?? 0,
  };
}
