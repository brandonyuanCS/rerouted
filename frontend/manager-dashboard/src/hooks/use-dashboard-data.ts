'use client';

import { useCallback, useEffect, useState } from 'react';

import { getDataSummary, getDisruptions, type ApiDisruption } from '@/lib/api';

export interface DashboardData {
  totalFlights: number;
  totalCrew: number;
  totalDisruptions: number;
  delays: number;
  affectedCrew: number;
  disruptions: ApiDisruption[];
}

const RESULT_STORAGE_KEY = 'rerouted-last-optimization';

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const [summary, disruptions] = await Promise.all([
        getDataSummary(),
        getDisruptions(),
      ]);
      setData({
        totalFlights: summary.total_flights,
        totalCrew: summary.total_crew,
        totalDisruptions: summary.total_disruptions,
        delays: summary.delays,
        affectedCrew: summary.affected_crew,
        disruptions,
      });
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timeout = window.setTimeout(() => void refetch(), 0);
    return () => window.clearTimeout(timeout);
  }, [refetch]);

  return { data, loading, error, refetch };
}

export function usePersistedResult<T>() {
  const [result, setResult] = useState<T | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const cached = localStorage.getItem(RESULT_STORAGE_KEY);
      return cached ? JSON.parse(cached) as T : null;
    } catch {
      localStorage.removeItem(RESULT_STORAGE_KEY);
      return null;
    }
  });

  const saveResult = useCallback((newResult: T | null) => {
    setResult(newResult);
    if (newResult) localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(newResult));
    else localStorage.removeItem(RESULT_STORAGE_KEY);
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    localStorage.removeItem(RESULT_STORAGE_KEY);
  }, []);

  return { result, saveResult, clearResult };
}
