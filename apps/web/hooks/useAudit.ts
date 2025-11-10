/**
 * useAudit Hook
 * Custom hook for managing audit data fetching and pagination state
 */

import { useState, useEffect, useCallback, useRef } from "react";
import {
  getUserActionsByProfilePaginated,
  getAuditInfo,
  AuditRecord,
  PaginationInfo,
  AuditInfoResponse,
} from "@/services/api/auditService";
import { useProfile } from "@/contexts/ProfileContext";
import { UserProfile } from "@zk-medical/shared";

export interface UseAuditOptions {
  userAddress?: string;
  autoFetch?: boolean;
}

export interface UseAuditReturn {
  records: AuditRecord[];
  pagination: PaginationInfo | null;
  auditInfo: AuditInfoResponse["data"] | null;

  isLoading: boolean;
  isLoadingMore: boolean;
  isLoadingInfo: boolean;
  hasDataLoaded: boolean;

  error: string | null;

  canRefresh: boolean;
  refreshCooldownSeconds: number;

  // eslint-disable-next-line no-unused-vars
  fetchRecords: (reset?: boolean) => Promise<void>;
  fetchMoreRecords: () => Promise<void>;
  // eslint-disable-next-line no-unused-vars
  goToPage: (page: number) => Promise<void>;
  refresh: () => Promise<void>;
  loadInitialData: () => Promise<void>;

  currentProfile: UserProfile;
}
export const useAudit = ({
  userAddress,
  autoFetch = false,
}: UseAuditOptions = {}): UseAuditReturn => {
  const { currentProfile } = useProfile();

  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [auditInfo, setAuditInfo] = useState<AuditInfoResponse["data"] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingInfo, setIsLoadingInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasDataLoaded, setHasDataLoaded] = useState(false);
  const [refreshCooldownSeconds, setRefreshCooldownSeconds] = useState(0);
  const currentLimit = 20;

  const [pageCache, setPageCache] = useState<
    Map<string, { records: AuditRecord[]; pagination: PaginationInfo }>
  >(new Map());

  const fetchInProgressRef = useRef(false);

  const lastRefreshTimeRef = useRef<number>(0);
  const REFRESH_COOLDOWN_MS = 20000; // 20s

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

  const fetchRecords = useCallback(
    async (reset: boolean = true) => {
      if (!userAddress) {
        setError("User address is required");
        return;
      }

      if (fetchInProgressRef.current) {
        return;
      }

      fetchInProgressRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        let response;

        const currentOffset = reset ? 0 : 0;

        response = await getUserActionsByProfilePaginated(
          userAddress,
          currentProfile,
          currentOffset,
          currentLimit,
          true
        );

        if (response.success && response.data.records && response.data.pagination) {
          const newRecords = response.data.records;
          const newPagination = response.data.pagination;

          if (reset) {
            setRecords(newRecords);

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
          setHasDataLoaded(true);
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
        records.length,
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

  const refresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;

    if (timeSinceLastRefresh < REFRESH_COOLDOWN_MS) {
      const remainingTime = Math.ceil((REFRESH_COOLDOWN_MS - timeSinceLastRefresh) / 1000);
      setRefreshCooldownSeconds(remainingTime);
      setError(`Please wait before refreshing again`);
      return;
    }

    lastRefreshTimeRef.current = now;
    setRefreshCooldownSeconds(0);
    setPageCache(new Map());
    await fetchRecords(true);
  }, [fetchRecords, REFRESH_COOLDOWN_MS]);

  useEffect(() => {
    if (refreshCooldownSeconds > 0) {
      const timer = setTimeout(() => {
        setRefreshCooldownSeconds((prev) => {
          const newValue = prev - 1;
          if (newValue === 0) {
            setError(null);
          }
          return newValue;
        });
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [refreshCooldownSeconds]);

  const loadInitialData = useCallback(async () => {
    await fetchRecords(true);
  }, [fetchRecords]);

  const goToPage = useCallback(
    async (page: number) => {
      if (!userAddress || !pagination) return;

      const cacheKey = getCacheKey(page);

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

          setRecords(newRecords);
          setPagination(newPagination);

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

  useEffect(() => {
    if (userAddress && autoFetch) {
      fetchRecords(true);
    }
  }, [userAddress, currentProfile, currentLimit, autoFetch, fetchRecords]);

  useEffect(() => {
    fetchAuditInfo();
  }, [fetchAuditInfo]);

  useEffect(() => {
    setRecords([]);
    setPagination(null);
    setPageCache(new Map());
    setHasDataLoaded(false);
  }, [currentProfile, userAddress]);

  return {
    records,
    pagination,
    auditInfo,
    isLoading,
    isLoadingMore,
    isLoadingInfo,
    hasDataLoaded,
    error,
    canRefresh: refreshCooldownSeconds === 0,
    refreshCooldownSeconds,
    fetchRecords,
    fetchMoreRecords,
    goToPage,
    refresh,
    loadInitialData,
    currentProfile,
  };
};
