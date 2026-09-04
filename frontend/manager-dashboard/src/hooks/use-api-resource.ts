'use client';

import { useCallback, useEffect, useState } from 'react';

interface ApiResource<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
  refetch: () => Promise<void>;
}

export function useApiResource<T>(load: () => Promise<T>): ApiResource<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      setData(await load());
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  }, [load]);

  useEffect(() => {
    const timeout = window.setTimeout(() => void refetch(), 0);
    return () => window.clearTimeout(timeout);
  }, [refetch]);

  return { data, error, loading, refetch };
}
