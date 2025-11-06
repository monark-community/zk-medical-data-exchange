/**
 * Hook for managing user's study participations
 */

import { useState, useEffect, useCallback } from "react";
import { 
  getUserParticipations, 
  checkParticipationStatus,
  type ParticipationInfo 
} from "@/services/api/participationService";
import { useAuth } from "./useAuth";

export const useParticipations = () => {
  const { address } = useAuth();
  const [participations, setParticipations] = useState<ParticipationInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch all user participations
   */
  const fetchParticipations = useCallback(async () => {
    if (!address) {
      setParticipations([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await getUserParticipations(address);
      setParticipations(response.participations);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch participations";
      setError(errorMessage);
      console.error("Failed to fetch participations:", err);
    } finally {
      setLoading(false);
    }
  }, [address]);

  /**
   * Check if user has participated in a specific study
   */
  const hasParticipated = useCallback(
    async (studyId: number): Promise<boolean> => {
      if (!address) return false;

      try {
        const response = await checkParticipationStatus(studyId, address);
        return response.hasParticipated;
      } catch (err) {
        console.error("Failed to check participation status:", err);
        return false;
      }
    },
    [address]
  );

  /**
   * Get participation info for a specific study
   */
  const getParticipationForStudy = useCallback(
    (studyId: number) => {
      return participations.find(p => p.studyId === studyId);
    },
    [participations]
  );

  // Auto-fetch when address changes
  useEffect(() => {
    fetchParticipations();
  }, [fetchParticipations]);

  return {
    participations,
    loading,
    error,
    refetch: fetchParticipations,
    hasParticipated,
    getParticipationForStudy,
  };
};
