"use client";

import { useState, useEffect } from "react";
import { getStudies } from "@/services/api/studyService";
import { StudySummary } from "@/services/api/studyService";

interface UseStudiesResult {
  studies: StudySummary[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useStudies(walletAddress?: string, fetchAll = false): UseStudiesResult {
  const [studies, setStudies] = useState<StudySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudies = async () => {
    if (!fetchAll && !walletAddress) {
      setStudies([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (fetchAll) {
        const response = await getStudies({});
        setStudies(response.studies || []);
      } else {
        const response = await getStudies({
          createdBy: walletAddress,
        });
        setStudies(response.studies || []);
      }
    } catch (err) {
      console.error("Error fetching studies:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch studies");
      setStudies([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStudies();
  }, [walletAddress, fetchAll]);

  const refetchWithDelay = async () => {
    // Small delay to ensure the deletion is processed on the server
    setTimeout(() => {
      fetchStudies();
    }, 500);
  };

  return {
    studies,
    isLoading,
    error,
    refetch: refetchWithDelay,
  };
}
