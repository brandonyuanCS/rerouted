"""
Pydantic schemas for API requests/responses.
"""

from pydantic import BaseModel
from typing import Optional


class JobCreateRequest(BaseModel):
    """Request to create an optimization job."""
    num_workers: int = 8
    timeout_seconds: float = 30.0
    priority: str = "balanced"  # "minimize_delays", "minimize_cost", "balanced"


class JobResponse(BaseModel):
    """Job status response."""
    job_id: str
    status: str
    created_at: float
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    progress: dict = {}
    result: Optional[dict] = None
    error: Optional[str] = None


class OptimizationResultResponse(BaseModel):
    """Optimization result details."""
    best_score: float
    total_scenarios_evaluated: int
    total_iterations: int
    workers_used: int
    solution: dict
    per_worker_results: list[dict]


class DataSummaryResponse(BaseModel):
    """Summary of loaded data."""
    total_flights: int
    total_crew: int
    total_pairings: int
    total_disruptions: int
    delays: int
    cancellations: int
    affected_crew: int
