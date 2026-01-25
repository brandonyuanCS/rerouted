import { Disruption, Flight, Crew, DashboardStats } from './types';

const API_BASE_ukl = 'http://localhost:8002/api';

export async function fetchDashboardData() {
  const [summaryRes, disruptionsRes, flightsRes] = await Promise.all([
    fetch(`${API_BASE_ukl}/data/summary`),
    fetch(`${API_BASE_ukl}/data/disruptions`),
    fetch(`${API_BASE_ukl}/data/flights`),
  ]);

  const summary = await summaryRes.json();
  const disruptions = await disruptionsRes.json();
  const flights = await flightsRes.json();

  return {
    summary,
    disruptions,
    flights,
  };
}

export async function submitOptimizationJob(config: any) {
  const res = await fetch(`${API_BASE_ukl}/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  return res.json();
}

export async function getJobStatus(jobId: string) {
  const res = await fetch(`${API_BASE_ukl}/jobs/${jobId}`);
  return res.json();
}
