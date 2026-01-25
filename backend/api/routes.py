"""
API routes for the optimization backend.
"""

import asyncio
from fastapi import APIRouter, HTTPException, BackgroundTasks

from api.schemas import (
    JobCreateRequest, JobResponse,
    DataSummaryResponse, OptimizationResultResponse,
)
from jobs.manager import job_manager, JobStatus
from data.loader import load_all_data
from parallel.ray_workers import run_parallel_optimization
from optimizer.types import DisruptionType


router = APIRouter()


# Cache loaded data
_data_cache = None


def get_data(use_large: bool = True):
    """Get cached data or load fresh.
    
    Args:
        use_large: Use large dataset (600 flights) for maximum HPC impact
    """
    global _data_cache
    if _data_cache is None:
        _data_cache = load_all_data(use_large=use_large)
    return _data_cache


@router.get("/data/summary", response_model=DataSummaryResponse)
async def get_data_summary():
    """Get summary of current data."""
    data = get_data()
    
    disruptions = data["disruptions"]
    delays = sum(1 for d in disruptions if d.type == DisruptionType.DELAY)
    cancellations = sum(1 for d in disruptions if d.type == DisruptionType.CANCELLATION)
    
    return DataSummaryResponse(
        total_flights=len(data["flights"]),
        total_crew=len(data["crew"]),
        total_pairings=len(data["pairings"]),
        total_disruptions=len(disruptions),
        delays=delays,
        cancellations=cancellations,
        affected_crew=len(data["affected_crew"]),
    )


@router.get("/data/disruptions")
async def get_disruptions():
    """Get list of disruptions."""
    data = get_data()
    return [
        {
            "flight_number": d.flight_number,
            "type": d.type.value,
            "cause": d.cause.value,
            "delay_minutes": d.delay_minutes,
            "original_departure": d.original_departure,
            "new_departure": d.new_departure,
            "is_cascade": d.is_cascade,
        }
        for d in data["disruptions"]
    ]


@router.get("/data/flights")
async def get_flights():
    """Get list of flights."""
    data = get_data()
    return [
        {
            "flight_number": f.flight_number,
            "origin": f.origin,
            "destination": f.destination,
            "aircraft": f.aircraft,
            "scheduled_departure": f.scheduled_departure,
            "duration": f.duration,
        }
        for f in data["flights"]
    ]


@router.post("/jobs", response_model=JobResponse)
async def create_job(request: JobCreateRequest, background_tasks: BackgroundTasks):
    """Submit a new optimization job."""
    job = job_manager.create_job({
        "num_workers": request.num_workers,
        "timeout_seconds": request.timeout_seconds,
        "priority": request.priority,
    })
    
    # Run optimization in background
    background_tasks.add_task(run_optimization_job, job.job_id)
    
    return JobResponse(
        job_id=job.job_id,
        status=job.status.value,
        created_at=job.created_at,
        progress=job.progress,
    )


@router.get("/jobs/{job_id}", response_model=JobResponse)
async def get_job(job_id: str):
    """Get job status and result."""
    job = job_manager.get_job(job_id)
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobResponse(
        job_id=job.job_id,
        status=job.status.value,
        created_at=job.created_at,
        started_at=job.started_at,
        completed_at=job.completed_at,
        progress=job.progress,
        result=job.result,
        error=job.error,
    )


@router.get("/jobs")
async def list_jobs():
    """List all jobs."""
    jobs = job_manager.list_jobs()
    return [
        {
            "job_id": j.job_id,
            "status": j.status.value,
            "created_at": j.created_at,
            "completed_at": j.completed_at,
        }
        for j in jobs
    ]


async def run_optimization_job(job_id: str):
    """Run optimization in background."""
    job = job_manager.get_job(job_id)
    if not job:
        return
    
    try:
        job_manager.update_status(job_id, JobStatus.RUNNING)
        job_manager.update_progress(job_id, {
            "message": "Initializing parallel workers...",
            "workers_started": 0,
        })
        
        # Get data
        data = get_data()
        
        config = job.config
        num_workers = config.get("num_workers", 8)
        timeout = config.get("timeout_seconds", 30.0)
        
        job_manager.update_progress(job_id, {
            "message": f"Starting {num_workers} parallel workers...",
            "workers_started": num_workers,
        })
        
        # Run parallel optimization
        result = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: run_parallel_optimization(
                data["crew"],
                data["flights"],
                data["pairings"],
                data["disruptions"],
                affected_crew=data["affected_crew"],
                num_workers=num_workers,
                timeout_seconds=timeout,
            )
        )
        
        job_manager.set_result(job_id, result)
        
    except Exception as e:
        job_manager.set_error(job_id, str(e))
