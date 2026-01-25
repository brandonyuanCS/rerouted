'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  submitOptimizationJob,
  getJobStatus,
  Job,
  OptimizationResult
} from '@/lib/api';

export type OptimizationState =
  | 'idle'
  | 'submitting'
  | 'running'
  | 'completed'
  | 'error';

export interface UseOptimizationJobReturn {
  state: OptimizationState;
  job: Job | null;
  result: OptimizationResult | null;
  error: string | null;
  progress: {
    workersStarted: number;
    scenariosEvaluated: number;
    message: string;
    computeMode: 'cloud' | 'local' | null;
  };
  elapsedTime: number;
  startOptimization: (numWorkers?: number) => Promise<void>;
  reset: () => void;
}

/**
 * Hook for managing optimization job lifecycle
 */
export function useOptimizationJob(): UseOptimizationJobReturn {
  const [state, setState] = useState<OptimizationState>('idle');
  const [job, setJob] = useState<Job | null>(null);
  const [result, setResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Start timer when job starts running
  useEffect(() => {
    if (state === 'running' && startTime) {
      timerRef.current = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
      }, 100);
    } else if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [state, startTime]);

  const pollJobStatus = useCallback(async (jobId: string) => {
    try {
      const updatedJob = await getJobStatus(jobId);
      setJob(updatedJob);

      if (updatedJob.status === 'completed') {
        setState('completed');
        setResult(updatedJob.result);
        if (pollingRef.current) clearInterval(pollingRef.current);
      } else if (updatedJob.status === 'failed') {
        setState('error');
        setError(updatedJob.error || 'Job failed');
        if (pollingRef.current) clearInterval(pollingRef.current);
      }
    } catch (err) {
      console.error('Polling error:', err);
    }
  }, []);

  const startOptimization = useCallback(async (numWorkers: number = 4) => {
    try {
      setState('submitting');
      setError(null);
      setResult(null);
      setElapsedTime(0);

      const newJob = await submitOptimizationJob(numWorkers);
      setJob(newJob);
      setState('running');
      setStartTime(Date.now());

      // Start polling
      pollingRef.current = setInterval(() => {
        pollJobStatus(newJob.job_id);
      }, 500);

    } catch (err) {
      setState('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, [pollJobStatus]);

  const reset = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (timerRef.current) clearInterval(timerRef.current);
    setState('idle');
    setJob(null);
    setResult(null);
    setError(null);
    setElapsedTime(0);
    setStartTime(null);
  }, []);

  const progress = {
    workersStarted: job?.progress?.workers_started || 0,
    scenariosEvaluated: job?.progress?.scenarios_evaluated || 0,
    message: job?.progress?.message || '',
    computeMode: job?.progress?.compute_mode || null,
  };

  return {
    state,
    job,
    result,
    error,
    progress,
    elapsedTime,
    startOptimization,
    reset,
  };
}
