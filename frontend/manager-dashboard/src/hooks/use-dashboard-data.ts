'use client';

import { useEffect, useState, useCallback } from 'react';
import { getDataSummary, getDisruptions } from '@/lib/api';

export interface DashboardData {
  totalFlights: number;
  totalCrew: number;
  totalDisruptions: number;
  delays: number;
  affectedCrew: number;
  disruptions: Array<{
    flight_number: string;
    type: string;
    cause: string;
    delay_minutes: number | null;
    origin: string;
    destination: string;
  }>;
}

const STORAGE_KEY = 'crew-recovery-dashboard-data';
const RESULT_STORAGE_KEY = 'crew-recovery-last-result';

/**
 * Hook for fetching dashboard data from backend with localStorage persistence
 */
export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);

      const [summary, disruptions] = await Promise.all([
        getDataSummary(),
        getDisruptions(),
      ]);

      const dashboardData: DashboardData = {
        totalFlights: summary.total_flights,
        totalCrew: summary.total_crew,
        totalDisruptions: summary.total_disruptions,
        delays: summary.delays,
        affectedCrew: summary.affected_crew,
        disruptions: disruptions, // Return all for map, slice in UI
      };

      setData(dashboardData);

      // Cache in localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dashboardData));

      setError(null);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');

      // Try to load from cache
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        setData(JSON.parse(cached));
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load - try cache first, then fetch
  useEffect(() => {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      setData(JSON.parse(cached));
      setLoading(false);
    }

    // Always fetch fresh data
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData };
}

/**
 * Hook for persisting optimization results across navigation
 */
export function usePersistedResult<T>() {
  const [result, setResult] = useState<T | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const cached = localStorage.getItem(RESULT_STORAGE_KEY);
    if (cached) {
      try {
        setResult(JSON.parse(cached));
      } catch {
        // Invalid cache, ignore
      }
    }
  }, []);

  // Save to localStorage when result changes
  const saveResult = useCallback((newResult: T | null) => {
    setResult(newResult);
    if (newResult) {
      localStorage.setItem(RESULT_STORAGE_KEY, JSON.stringify(newResult));
    } else {
      localStorage.removeItem(RESULT_STORAGE_KEY);
    }
  }, []);

  const clearResult = useCallback(() => {
    setResult(null);
    localStorage.removeItem(RESULT_STORAGE_KEY);
  }, []);

  return { result, saveResult, clearResult };
}
