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

export function useStudies(walletAddress?: string): UseStudiesResult {
  const [studies, setStudies] = useState<StudySummary[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStudies = async () => {
    if (!walletAddress) {
      setStudies([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log("Fetching studies for wallet:", walletAddress);
      const response = await getStudies({
        createdBy: walletAddress,
        // No limit - API will return all user's studies
      });
      console.log("Received studies:", response.studies?.length || 0, "studies");
      setStudies(response.studies || []);
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
  }, [walletAddress]);

  const refetchWithDelay = async () => {
    // Small delay to ensure the deletion is processed on the server
    setTimeout(() => {
      console.log("Refetching studies after deletion...");
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
