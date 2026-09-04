/**
 * API client for Crew Recovery Command Center backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface JobProgress {
  workers_started: number;
  scenarios_evaluated: number;
  message?: string;
  compute_mode?: 'cloud' | 'local';
}

export interface PerWorkerResult {
  worker_id: number;
  score: number;
  iterations: number;
  moves: number;
}

export interface Reassignment {
  type: string;
  flight: string;
  crew_id: string;
  crew_name: string;
  crew_role: string;
  from_location: string;
  to_location: string;
  reason: string;
  action: string;
}

export interface OptimizationMetrics {
  total_disrupted_flights: number;
  flights_recovered: number;
  crew_reassigned: number;
  original_delay_minutes: number;
  projected_delay_saved: number;
  cost_savings_usd: number;
}

export interface OptimizationResult {
  best_score: number;
  best_worker_id: number;
  total_scenarios_evaluated: number;
  total_iterations: number;
  workers_used: number;
  reassignments: Reassignment[];
  metrics: OptimizationMetrics;
  per_worker_results: PerWorkerResult[];
  execution_context?: {
    function_name: string;
    memory_limit_mb: string;
    remaining_time_ms: number;
  };
  compute_mode: 'cloud' | 'local';
}

export interface Job {
  job_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  created_at: number;
  started_at: number | null;
  completed_at: number | null;
  progress: JobProgress;
  result: OptimizationResult | null;
  error: string | null;
}

/**
 * Submit a new optimization job
 */
export async function submitOptimizationJob(numWorkers: number = 4): Promise<Job> {
  const response = await fetch(`${API_BASE}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ num_workers: numWorkers }),
  });

  if (!response.ok) {
    throw new Error(`Failed to submit job: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get job status and result
 */
export async function getJobStatus(jobId: string): Promise<Job> {
  const response = await fetch(`${API_BASE}/jobs/${jobId}`);

  if (!response.ok) {
    throw new Error(`Failed to get job: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get data summary
 */
export async function getDataSummary() {
  const response = await fetch(`${API_BASE}/data/summary`);

  if (!response.ok) {
    throw new Error(`Failed to get data summary: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get disruptions list
 */
export async function getDisruptions() {
  const response = await fetch(`${API_BASE}/data/disruptions`);

  if (!response.ok) {
    throw new Error(`Failed to get disruptions: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Publish solution to crew mobile app
 */
export async function publishSolution(solution: OptimizationResult): Promise<{ success: boolean; message: string }> {
  const response = await fetch(`${API_BASE}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(solution),
  });

  if (!response.ok) {
    throw new Error(`Failed to publish solution: ${response.statusText}`);
  }

  return response.json();
}
