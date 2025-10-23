/**
 * useAudit Hook
 * Custom hook for managing audit data fetching and pagination state
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getUserActionsByProfilePaginated,
  getAuditInfo,
  UserProfile,
  AuditRecord,
  PaginationInfo,
  AuditInfoResponse,
} from "@/services/api/auditService";
import { useProfile } from "@/contexts/ProfileContext";

export interface UseAuditOptions {
  userAddress?: string;
  autoFetch?: boolean;
}

export interface UseAuditReturn {
  // Data
  records: AuditRecord[];
  pagination: PaginationInfo | null;
  auditInfo: AuditInfoResponse["data"] | null;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  isLoadingInfo: boolean;
  hasDataLoaded: boolean; // Track if data has been loaded at least once

  // Error states
  error: string | null;

  // Refresh state
  canRefresh: boolean; // Whether refresh is available (not in cooldown)
  refreshCooldownSeconds: number; // Remaining cooldown time in seconds

  // Actions
  // eslint-disable-next-line no-unused-vars
  fetchRecords: (reset?: boolean) => Promise<void>;
  fetchMoreRecords: () => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  goToPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  loadInitialData: () => Promise<void>; // Trigger initial data load

  // Current state
  currentProfile: UserProfile; // Changed from UserProfile | "all" to just UserProfile
}
export const useAudit = ({
  userAddress,
  autoFetch = false, // Changed default to false for manual control
}: UseAuditOptions = {}): UseAuditReturn => {
  // Get current profile from context
  const { currentProfile } = useProfile();

  // State
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [auditInfo, setAuditInfo] = useState<AuditInfoResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDataLoaded, setHasDataLoaded] = useState(false); // Track if data has been loaded
  const [refreshCooldownSeconds, setRefreshCooldownSeconds] = useState(0); // Cooldown timer
  const currentLimit = 20; // Fixed page size

  // In-memory page cache for current session
  const [pageCache, setPageCache] = useState<
    Map<string, { records: AuditRecord[]; pagination: PaginationInfo }>
  >(new Map());

  const fetchInProgressRef = useRef(false);

  // Limit refresh to 20s cooldown
  const lastRefreshTimeRef = useRef<number>(0);
  const REFRESH_COOLDOWN_MS = 20000;

  // Helper function to generate cache key
  const getCacheKey = useCallback(
    (page: number) => {
      return `${userAddress}_${currentProfile}_${page}`;
    },
    [userAddress, currentProfile]
  );

  const fetchAuditInfo = useCallback(async () => {
    setIsLoadingInfo(true);
    setError(null);

    try {
      const response = await getAuditInfo();

      if (response.success) {
        setAuditInfo(response.data);
      } else {
        setError(response.error || "Failed to fetch audit info");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch audit info");
    } finally {
      setIsLoadingInfo(false);
    }
  }, []);

  // Fetch records function
  const fetchRecords = useCallback(
    async (reset: boolean = true) => {
      if (!userAddress) {
        setError("User address is required");
        return;
      }

      // Prevent duplicate calls
      if (fetchInProgressRef.current) {
        return;
      }

      fetchInProgressRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        let response;

        // Always use paginated endpoint
        const currentOffset = reset ? 0 : 0; // Always use 0 for now, fetchMoreRecords will handle pagination

        response = await getUserActionsByProfilePaginated(
          userAddress,
          currentProfile,
          currentOffset,
          currentLimit,
          true // latest first
        );

        if (response.success && response.data.records && response.data.pagination) {
          const newRecords = response.data.records;
          const newPagination = response.data.pagination;

          if (reset) {
            setRecords(newRecords);

            // Cache the first page in memory
            const cacheKey = getCacheKey(1);
            setPageCache((prev) => {
              const newCache = new Map(prev);
              newCache.set(cacheKey, {
                records: newRecords,
                pagination: newPagination,
              });
              return newCache;
            });
          } else {
            setRecords((prevRecords) => [...prevRecords, ...newRecords]);
          }
          setPagination(newPagination);
          setHasDataLoaded(true); // Mark that data has been loaded
        } else {
          console.error("getUserActionsByProfilePaginated failed:", response.error);
          setError(response.error || "Failed to fetch audit records");
        }
      } catch (err) {
        console.error("fetchRecords error:", err);
        setError(err instanceof Error ? err.message : "Failed to fetch audit records");
      } finally {
        setIsLoading(false);
        fetchInProgressRef.current = false;
      }
    },
    [userAddress, currentProfile, currentLimit, getCacheKey]
  );

  // Fetch more records (pagination)
  const fetchMoreRecords = useCallback(async () => {
    if (!pagination?.hasMore || isLoadingMore || !userAddress) {
      return;
    }

    setIsLoadingMore(true);
    setError(null);

    try {
      const response = await getUserActionsByProfilePaginated(
        userAddress,
        currentProfile,
        records.length, // Use current records length as offset
        currentLimit,
        true
      );

      if (response.success && response.data.records && response.data.pagination) {
        const newRecords = response.data.records;
        setRecords((prev) => [...prev, ...newRecords]);
        setPagination(response.data.pagination);
      } else {
        setError(response.error || "Failed to fetch more audit records");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch more audit records");
    } finally {
      setIsLoadingMore(false);
    }
  }, [userAddress, currentProfile, currentLimit, records.length, pagination, isLoadingMore]);

  // Refresh function - force reload and clear in-memory cache
  const refresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;

    // Check if cooldown period has passed
    if (timeSinceLastRefresh < REFRESH_COOLDOWN_MS) {
      const remainingTime = Math.ceil((REFRESH_COOLDOWN_MS - timeSinceLastRefresh) / 1000);
      setRefreshCooldownSeconds(remainingTime);
      setError(`Please wait before refreshing again`);
      return;
    }

    lastRefreshTimeRef.current = now;
    setRefreshCooldownSeconds(0);
    setPageCache(new Map()); // Clear in-memory cache on refresh
    await fetchRecords(true);
  }, [fetchRecords, REFRESH_COOLDOWN_MS]);

  // Effect to handle cooldown countdown
  useEffect(() => {
    if (refreshCooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldownSeconds((prev) => {
          const newValue = prev - 1;
          if (newValue === 0) {
            setError(null); // Clear the cooldown error message
          }
          return newValue;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [refreshCooldownSeconds]);

  // Load initial data function - for manual first load
  const loadInitialData = useCallback(async () => {
    await fetchRecords(true);
  }, [fetchRecords]);

  // Navigate to specific page with in-memory caching
  const goToPage = useCallback(
    async (page: number) => {
      if (!userAddress || !pagination) return;

      const cacheKey = getCacheKey(page);

      // Check if page is already cached in memory
      const cachedData = pageCache.get(cacheKey);
      if (cachedData) {
        setRecords(cachedData.records);
        setPagination(cachedData.pagination);
        return;
      }

      const newOffset = (page - 1) * currentLimit;
      setIsLoading(true);
      setError(null);

      try {
        const response = await getUserActionsByProfilePaginated(
          userAddress,
          currentProfile,
          newOffset,
          currentLimit,
          true
        );

        if (response.success && response.data.records && response.data.pagination) {
          const newRecords = response.data.records;
          const newPagination = response.data.pagination;

          // Update current state
          setRecords(newRecords);
          setPagination(newPagination);

          // Cache this page in memory
          setPageCache((prev) => {
            const newCache = new Map(prev);
            newCache.set(cacheKey, {
              records: newRecords,
              pagination: newPagination,
            });
            return newCache;
          });
        } else {
          setError(response.error || "Failed to fetch page");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch page");
      } finally {
        setIsLoading(false);
      }
    },
    [userAddress, currentProfile, currentLimit, pagination, pageCache, getCacheKey]
  );

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    // Auto-fetch if explicitly enabled
    if (userAddress && autoFetch) {
      fetchRecords(true);
    }
  }, [userAddress, currentProfile, currentLimit, autoFetch, fetchRecords]);

  // Fetch audit info on mount
  useEffect(() => {
    fetchAuditInfo();
  }, [fetchAuditInfo]);

  // Clear data and cache when profile changes
  useEffect(() => {
    setRecords([]);
    setPagination(null);
    setPageCache(new Map()); // Clear in-memory cache when profile changes
    setHasDataLoaded(false); // Reset data loaded flag
  }, [currentProfile, userAddress]);

  return {
    // Data
    records,
    pagination,
    auditInfo,

    // Loading states
    isLoading,
    isLoadingMore,
    isLoadingInfo,
    hasDataLoaded,

    // Error states
    error,

    // Refresh state
    canRefresh: refreshCooldownSeconds === 0,
    refreshCooldownSeconds,

    // Actions
    fetchRecords,
    fetchMoreRecords,
    goToPage,
    refresh,
    loadInitialData,

    // Current state
    currentProfile,
  };
};
