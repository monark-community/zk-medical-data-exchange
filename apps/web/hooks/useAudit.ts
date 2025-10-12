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
  hasDataLoaded: boolean; // New property to track if data has been loaded

  // Error states
  error: string | null;

  // Actions
  fetchRecords: (reset?: boolean) => Promise<void>;
  fetchMoreRecords: () => Promise<void>;
  goToPage: (page: number) => Promise<void>; // New function for page navigation
  refresh: () => Promise<void>;
  loadInitialData: () => Promise<void>; // New function for initial manual load

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
  const currentLimit = 20; // Fixed page size

  // Page cache to avoid redundant blockchain calls
  const [pageCache, setPageCache] = useState<
    Map<string, { records: AuditRecord[]; pagination: PaginationInfo }>
  >(() => {
    // Initialize cache from session storage
    if (typeof window !== "undefined") {
      const cacheKey = `audit_page_cache_${userAddress}_${currentProfile}`;
      const storedCache = sessionStorage.getItem(cacheKey);
      if (storedCache) {
        try {
          const parsedCache = JSON.parse(storedCache);
          return new Map(Object.entries(parsedCache));
        } catch (e) {
          console.warn("Failed to parse cached audit data:", e);
        }
      }
    }
    return new Map();
  });

  // Session storage key for this user and profile
  const sessionKey = `audit_data_loaded_${userAddress}_${currentProfile}`;
  const cacheKey = `audit_page_cache_${userAddress}_${currentProfile}`;

  // Initialize hasDataLoaded from session storage
  const [hasDataLoaded, setHasDataLoaded] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem(sessionKey) === "true";
    }
    return false;
  });

  // Add a ref to track if a request is already in progress
  const fetchInProgressRef = useRef(false);

  // Add a ref to track if we've done the initial session restore
  const sessionRestoreAttemptedRef = useRef(false);

  // Helper function to generate cache key
  const getCacheKey = useCallback(
    (page: number, limit: number) => {
      return `${userAddress}_${currentProfile}_${page}_${limit}`;
    },
    [userAddress, currentProfile]
  );

  // Helper function to save cache to session storage
  const saveCacheToStorage = useCallback(
    (cache: Map<string, { records: AuditRecord[]; pagination: PaginationInfo }>) => {
      if (typeof window !== "undefined") {
        try {
          const cacheObject = Object.fromEntries(cache.entries());
          sessionStorage.setItem(cacheKey, JSON.stringify(cacheObject));
        } catch (e) {
          console.warn("Failed to save audit cache to session storage:", e);
        }
      }
    },
    [cacheKey]
  );

  // Fetch audit system info
  const fetchAuditInfo = useCallback(async () => {
    setIsLoadingInfo(true);
    setError(null);

    try {
      console.log("Fetching audit info...");
      const response = await getAuditInfo();
      console.log("Audit info response:", response);

      if (response.success) {
        setAuditInfo(response.data);
      } else {
        console.error("getAuditInfo failed:", response.error);
        setError(response.error || "Failed to fetch audit info");
      }
    } catch (err) {
      console.error("fetchAuditInfo error:", err);
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
        console.log("Fetch already in progress, skipping...");
        return;
      }

      console.log("fetchRecords called:", {
        userAddress,
        currentProfile,
        currentLimit,
        reset,
      });

      fetchInProgressRef.current = true;
      setIsLoading(true);
      setError(null);

      try {
        let response;

        // Always use paginated endpoint for DATA_SELLER profile
        console.log("Fetching paginated user actions for DATA_SELLER profile");
        const currentOffset = reset ? 0 : 0; // Always use 0 for now, fetchMoreRecords will handle pagination

        response = await getUserActionsByProfilePaginated(
          userAddress,
          currentProfile,
          currentOffset,
          currentLimit,
          true // latest first
        );

        console.log("getUserActionsByProfilePaginated response:", response);

        if (response.success && response.data.records && response.data.pagination) {
          const newRecords = response.data.records;
          const newPagination = response.data.pagination;

          if (reset) {
            setRecords(newRecords);

            // Cache the first page
            const cacheKey = getCacheKey(1, currentLimit);
            setPageCache((prev) => {
              const newCache = new Map(prev).set(cacheKey, {
                records: newRecords,
                pagination: newPagination,
              });
              saveCacheToStorage(newCache);
              return newCache;
            });
          } else {
            setRecords((prevRecords) => [...prevRecords, ...newRecords]);
          }
          setPagination(newPagination);
          setHasDataLoaded(true); // Mark data as loaded

          // Save to session storage
          if (typeof window !== "undefined") {
            sessionStorage.setItem(sessionKey, "true");
          }
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
    [userAddress, currentProfile, currentLimit, getCacheKey, saveCacheToStorage]
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

  // Profile setter (removed - profile is now fixed)
  // const setProfile = useCallback((newProfile: UserProfile | "all") => {
  //   // Profile is now hardcoded, this function is not needed
  // }, []);

  // Refresh function - force reload and clear session storage and cache
  const refresh = useCallback(async () => {
    // Clear session storage to force fresh load
    if (typeof window !== "undefined") {
      sessionStorage.removeItem(sessionKey);
      sessionStorage.removeItem(cacheKey); // Clear cached pages
    }
    setHasDataLoaded(false);
    setPageCache(new Map()); // Clear cache on refresh
    sessionRestoreAttemptedRef.current = false; // Reset the restore flag
    await fetchRecords(true);
  }, [fetchRecords, sessionKey, cacheKey]);

  // Load initial data function - for manual first load
  const loadInitialData = useCallback(async () => {
    if (!hasDataLoaded) {
      await fetchRecords(true);
    }
  }, [fetchRecords, hasDataLoaded]);

  // Navigate to specific page with caching
  const goToPage = useCallback(
    async (page: number) => {
      if (!userAddress || !pagination) return;

      const cacheKey = getCacheKey(page, currentLimit);

      // Check if page is already cached
      if (pageCache.has(cacheKey)) {
        console.log(`Loading page ${page} from cache`);
        const cachedData = pageCache.get(cacheKey)!;
        setRecords(cachedData.records);
        setPagination(cachedData.pagination);
        return;
      }

      console.log(`Fetching page ${page} from blockchain`);
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

          // Cache this page
          setPageCache((prev) => {
            const newCache = new Map(prev).set(cacheKey, {
              records: newRecords,
              pagination: newPagination,
            });
            saveCacheToStorage(newCache);
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
    [
      userAddress,
      currentProfile,
      currentLimit,
      pagination,
      pageCache,
      getCacheKey,
      saveCacheToStorage,
    ]
  );

  // Auto-fetch on mount and when dependencies change
  useEffect(() => {
    console.log("useAudit useEffect triggered:", {
      autoFetch,
      userAddress,
      currentProfile,
      currentLimit,
      hasDataLoaded,
      recordsLength: records.length,
      sessionRestoreAttempted: sessionRestoreAttemptedRef.current,
    });

    // Auto-fetch if explicitly enabled
    if (userAddress && autoFetch) {
      console.log("Calling fetchRecords from useEffect (autoFetch enabled)");
      fetchRecords(true);
    }
  }, [userAddress, currentProfile, currentLimit, autoFetch]); // Removed hasDataLoaded to prevent loops

  // Separate effect for session restore - runs only once when component mounts
  useEffect(() => {
    if (
      userAddress &&
      hasDataLoaded &&
      records.length === 0 &&
      !sessionRestoreAttemptedRef.current &&
      !autoFetch
    ) {
      console.log("Session restore: attempting to reload data based on session storage");
      sessionRestoreAttemptedRef.current = true;

      // Try to restore from cache first
      if (pageCache.size > 0) {
        // Get the first cached page (likely page 1)
        const firstCacheEntry = pageCache.entries().next().value;
        if (firstCacheEntry) {
          const [, cachedData] = firstCacheEntry;
          console.log("Restoring from cached data instead of fetching");
          setRecords(cachedData.records);
          setPagination(cachedData.pagination);
          return;
        }
      }

      fetchRecords(true);
    }
  }, [userAddress, hasDataLoaded, autoFetch, pageCache]); // This runs when component mounts and user/session state is established

  // Fetch audit info on mount
  useEffect(() => {
    fetchAuditInfo();
  }, [fetchAuditInfo]);

  // Clear cache and data when profile changes
  useEffect(() => {
    // Clear existing data and cache when profile changes
    setRecords([]);
    setPagination(null);
    setPageCache(new Map());
    setHasDataLoaded(false);
    sessionRestoreAttemptedRef.current = false;

    // Clear session storage for the new profile
    if (typeof window !== "undefined") {
      const newSessionKey = `audit_data_loaded_${userAddress}_${currentProfile}`;
      const newCacheKey = `audit_page_cache_${userAddress}_${currentProfile}`;
      sessionStorage.removeItem(newSessionKey);
      sessionStorage.removeItem(newCacheKey);
    }
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
