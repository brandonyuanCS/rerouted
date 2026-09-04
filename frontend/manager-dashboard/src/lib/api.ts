/**
 * API client for Crew Recovery Command Center backend
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export interface JobProgress {
  workers_started: number;
  workers_completed?: number;
  workers_total?: number;
  scenarios_evaluated: number;
  iterations_completed?: number;
  best_score?: number;
  message?: string;
  compute_mode?: 'cloud' | 'local';
}

export interface DataSummary {
  total_flights: number;
  total_crew: number;
  total_pairings: number;
  total_disruptions: number;
  delays: number;
  cancellations: number;
  affected_crew: number;
}

export interface ApiDisruption {
  flight_number: string;
  type: 'delay' | 'cancellation';
  cause: string;
  delay_minutes: number | null;
  original_departure: string;
  new_departure: string | null;
  is_cascade: boolean;
  origin: string;
  destination: string;
}

export interface ApiFlight {
  flight_number: string;
  origin: string;
  destination: string;
  aircraft: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  duration: number;
  distance: number;
  passenger_capacity: number;
  assigned_crew: number;
  disruption_type: 'delay' | 'cancellation' | null;
  delay_minutes: number | null;
}

export interface ApiCrewMember {
  crew_id: string;
  name: string;
  role: 'pilot' | 'flightAttendant';
  status: 'available' | 'on_duty' | 'resting' | 'day_off';
  home_base: string;
  current_location: string;
  certifications: string[];
  duty_time_today: number;
  flight_time_today: number;
  consecutive_duty_days: number;
}

export interface ApiPairing {
  pairing_id: string;
  crew_id: string;
  crew_name: string;
  crew_role: 'pilot' | 'flightAttendant' | 'unknown';
  flights: string[];
  duty_start: string;
  duty_end: string;
  total_flight_time: number;
  total_duty_time: number;
  returns_to_base: boolean;
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
  covered_disrupted_flights: number;
  uncovered_disrupted_flights: number;
  coverage_rate: number;
  crew_reassigned: number;
  original_delay_minutes: number;
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
export async function getDataSummary(): Promise<DataSummary> {
  const response = await fetch(`${API_BASE}/data/summary`);

  if (!response.ok) {
    throw new Error(`Failed to get data summary: ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get disruptions list
 */
export async function getDisruptions(): Promise<ApiDisruption[]> {
  const response = await fetch(`${API_BASE}/data/disruptions`);

  if (!response.ok) {
    throw new Error(`Failed to get disruptions: ${response.statusText}`);
  }

  return response.json();
}

export async function getFlights(): Promise<ApiFlight[]> {
  const response = await fetch(`${API_BASE}/data/flights`);

  if (!response.ok) {
    throw new Error(`Failed to get flights: ${response.statusText}`);
  }

  return response.json();
}

export async function getCrew(): Promise<ApiCrewMember[]> {
  const response = await fetch(`${API_BASE}/data/crew`);

  if (!response.ok) {
    throw new Error(`Failed to get crew: ${response.statusText}`);
  }

  return response.json();
}

export async function getPairings(): Promise<ApiPairing[]> {
  const response = await fetch(`${API_BASE}/data/pairings`);

  if (!response.ok) {
    throw new Error(`Failed to get pairings: ${response.statusText}`);
  }

  return response.json();
}
