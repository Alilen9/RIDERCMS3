import apiClient from '../client/apiClient';
import { StatsResponse, StatsQueryParams } from '../types';

/**
 * Fetches session statistics from the /api/stats endpoint.
 *
 * @param params - Optional query parameters for filtering stats
 * @param params.scope - Scope filter (e.g., 'all')
 * @param params.sessionType - Session type filter ('all' | 'deposit' | 'Withdrawal')
 * @param params.days - Number of days to include in trend data (1-90, default 7)
 * @returns A promise that resolves with the stats data
 */
export const getStats = async (
  params: StatsQueryParams = {}
): Promise<StatsResponse> => {
  try {
    const response = await apiClient.get<StatsResponse>('/stats', {
      params: {
        scope: params.scope || 'all',
        sessionType: params.sessionType || 'all',
        days: params.days || 7,
      },
    });
    return response.data;
  } catch (error) {
    console.error('Failed to fetch stats:', error);
    throw error;
  }
};

/**
 * Fetches summary stats (pending, completed, failed counts).
 *
 * @returns A promise that resolves with summary stats
 */
export const getSummaryStats = async (): Promise<StatsResponse['summary'] & StatsResponse['extra']> => {
  const data = await getStats({ scope: 'all' });
  return {
    pending: data.summary.pending,
    completed: data.summary.completed,
    failed: data.summary.failed,
    failure: data.summary.failure,
    total: data.extra.total,
    opening: data.extra.opening,
    inprogress: data.extra.inprogress,
    cancelled: data.extra.cancelled,
    redeemed: data.extra.redeemed,
  };
};

/**
 * Fetches status trend chart data.
 *
 * @param days - Number of days to include (1-90)
 * @returns A promise that resolves with daily trend data
 */
export const getStatusTrend = async (
  days: number = 7
): Promise<StatsResponse['charts']['statusTrend']> => {
  const data = await getStats({ days });
  return data.charts.statusTrend;
};

/**
 * Fetches breakdown statistics.
 *
 * @returns A promise that resolves with breakdown data
 */
export const getBreakdowns = async (): Promise<StatsResponse['breakdowns']> => {
  const data = await getStats({ scope: 'all' });
  return data.breakdowns;
};

/**
 * Fetches stats filtered by session type.
 *
 * @param sessionType - The session type to filter by
 * @returns A promise that resolves with filtered stats
 */
export const getStatsBySessionType = async (
  sessionType: 'deposit' | 'Withdrawal'
): Promise<StatsResponse> => {
  return getStats({ sessionType, scope: 'all' });
};
