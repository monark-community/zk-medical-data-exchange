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
        console.log("Fetching all studies");
        const response = await getStudies({
        });
        console.log("Received studies:", response.studies?.length || 0, "studies");
        setStudies(response.studies || []);
      } else {
        console.log("Fetching studies for wallet:", walletAddress);
        const response = await getStudies({
          createdBy: walletAddress,
        });
        console.log("Received studies:", response.studies?.length || 0, "studies");
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
