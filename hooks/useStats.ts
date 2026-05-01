import { useState, useEffect, useCallback, useMemo } from 'react';
import { getStats, getSummaryStats, getStatusTrend, getBreakdowns, getStatsBySessionType } from '../services/statsService';
import { StatsResponse, StatsQueryParams } from '../types';

/**
 * Hook for fetching and managing stats data.
 *
 * @param params - Optional query parameters for filtering stats
 * @returns Object containing stats data, loading state, error, and refetch function
 */
export const useStats = (params: StatsQueryParams = {}) => {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Memoize params to prevent infinite re-fetching
  const memoizedParams = useMemo(() => params, [
    params.scope,
    params.sessionType,
    params.days,
  ]);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await getStats(memoizedParams);
      setData(stats);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [memoizedParams]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = () => {
    fetchStats();
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching summary stats (pending, completed, failed, total counts).
 *
 * @returns Object containing summary stats, loading state, error, and refetch function
 */
export const useSummaryStats = () => {
  const [summary, setSummary] = useState<(StatsResponse['summary'] & StatsResponse['extra']) | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await getSummaryStats();
      setSummary(stats);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  const refetch = () => {
    fetchSummary();
  };

  return {
    summary,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching status trend data for charts.
 *
 * @param days - Number of days to include in trend (1-90)
 * @returns Object containing trend data, loading state, error, and refetch function
 */
export const useStatusTrend = (days: number = 7) => {
  const [trend, setTrend] = useState<StatsResponse['charts']['statusTrend'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchTrend = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const trendData = await getStatusTrend(days);
      setTrend(trendData);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => {
    fetchTrend();
  }, [fetchTrend]);

  const refetch = () => {
    fetchTrend();
  };

  return {
    trend,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching breakdown statistics.
 *
 * @returns Object containing breakdown data, loading state, error, and refetch function
 */
export const useBreakdowns = () => {
  const [breakdowns, setBreakdowns] = useState<StatsResponse['breakdowns'] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchBreakdowns = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getBreakdowns();
      setBreakdowns(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBreakdowns();
  }, [fetchBreakdowns]);

  const refetch = () => {
    fetchBreakdowns();
  };

  return {
    breakdowns,
    loading,
    error,
    refetch,
  };
};

/**
 * Hook for fetching stats filtered by session type.
 *
 * @param sessionType - The session type to filter by
 * @returns Object containing filtered stats, loading state, error, and refetch function
 */
export const useStatsBySessionType = (sessionType: 'deposit' | 'Withdrawal') => {
  const [data, setData] = useState<StatsResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const stats = await getStatsBySessionType(sessionType);
      setData(stats);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [sessionType]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const refetch = () => {
    fetchStats();
  };

  return {
    data,
    loading,
    error,
    refetch,
  };
};
