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
from cloud.lambda_client import invoke_lambda_optimizer, is_cloud_enabled


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
    flights_by_number = {
        flight.flight_number: flight for flight in data["flights"]
    }

    disruptions = []
    for disruption in data["disruptions"]:
        flight = flights_by_number.get(disruption.flight_number)
        disruptions.append({
            "flight_number": disruption.flight_number,
            "type": disruption.type.value,
            "cause": disruption.cause.value,
            "delay_minutes": disruption.delay_minutes,
            "original_departure": disruption.original_departure,
            "new_departure": disruption.new_departure,
            "is_cascade": disruption.is_cascade,
            "origin": flight.origin if flight else "",
            "destination": flight.destination if flight else "",
        })

    return disruptions


@router.get("/data/flights")
async def get_flights():
    """Get list of flights."""
    data = get_data()
    disruptions_by_flight = {
        disruption.flight_number: disruption
        for disruption in data["disruptions"]
    }
    crew_by_flight: dict[str, set[str]] = {}
    for pairing in data["pairings"]:
        for flight_number in pairing.flights:
            crew_by_flight.setdefault(flight_number, set()).add(pairing.crew_id)

    return [
        {
            "flight_number": f.flight_number,
            "origin": f.origin,
            "destination": f.destination,
            "aircraft": f.aircraft,
            "scheduled_departure": f.scheduled_departure,
            "scheduled_arrival": f.scheduled_arrival,
            "duration": f.duration,
            "distance": f.distance,
            "passenger_capacity": f.typical_passenger_count,
            "assigned_crew": len(crew_by_flight.get(f.flight_number, set())),
            "disruption_type": (
                disruptions_by_flight[f.flight_number].type.value
                if f.flight_number in disruptions_by_flight else None
            ),
            "delay_minutes": (
                disruptions_by_flight[f.flight_number].delay_minutes
                if f.flight_number in disruptions_by_flight else None
            ),
        }
        for f in data["flights"]
    ]


@router.get("/data/crew")
async def get_crew():
    """Get the crew roster used by the current optimization dataset."""
    data = get_data()
    return [
        {
            "crew_id": crew.crew_id,
            "name": crew.name,
            "role": crew.role.value,
            "status": crew.status.value,
            "home_base": crew.home_base,
            "current_location": crew.current_location,
            "certifications": crew.certifications,
            "duty_time_today": crew.duty_time_today,
            "flight_time_today": crew.flight_time_today,
            "consecutive_duty_days": crew.consecutive_duty_days,
        }
        for crew in data["crew"]
    ]


@router.get("/data/pairings")
async def get_pairings():
    """Get active crew pairings with crew metadata."""
    data = get_data()
    crew_by_id = {crew.crew_id: crew for crew in data["crew"]}

    return [
        {
            "pairing_id": pairing.pairing_id,
            "crew_id": pairing.crew_id,
            "crew_name": (
                crew_by_id[pairing.crew_id].name
                if pairing.crew_id in crew_by_id else "Unknown crew member"
            ),
            "crew_role": (
                crew_by_id[pairing.crew_id].role.value
                if pairing.crew_id in crew_by_id else "unknown"
            ),
            "flights": pairing.flights,
            "duty_start": pairing.duty_start,
            "duty_end": pairing.duty_end,
            "total_flight_time": pairing.total_flight_time,
            "total_duty_time": pairing.total_duty_time,
            "returns_to_base": pairing.returns_to_base,
        }
        for pairing in data["pairings"]
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
    """Run optimization in background.
    
    Uses AWS Lambda if USE_CLOUD_COMPUTE=true, otherwise runs locally.
    """
    job = job_manager.get_job(job_id)
    if not job:
        return
    
    try:
        job_manager.update_status(job_id, JobStatus.RUNNING)
        
        # Get data
        data = get_data()
        
        config = job.config
        num_workers = config.get("num_workers", 8)
        timeout = config.get("timeout_seconds", 30.0)
        
        # Check if cloud compute is enabled
        use_cloud = is_cloud_enabled()
        
        if use_cloud:
            job_manager.update_progress(job_id, {
                "message": "Invoking AWS Lambda optimizer...",
                "compute_mode": "cloud",
                "workers_started": num_workers,
            })
            
            # Run on AWS Lambda
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: invoke_lambda_optimizer(
                    data["crew"],
                    data["flights"],
                    data["pairings"],
                    data["disruptions"],
                    num_workers=num_workers,
                    timeout_seconds=timeout,
                )
            )
        else:
            job_manager.update_progress(job_id, {
                "message": f"Starting {num_workers} local parallel workers...",
                "compute_mode": "local",
                "workers_started": num_workers,
                "workers_completed": 0,
                "workers_total": num_workers,
                "scenarios_evaluated": 0,
                "iterations_completed": 0,
            })

            def report_progress(progress: dict):
                job_manager.update_progress(job_id, progress)
            
            # Run locally
            result = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda: run_parallel_optimization(
                    data["crew"],
                    data["flights"],
                    data["pairings"],
                    data["disruptions"],
                    num_workers=num_workers,
                    timeout_seconds=timeout,
                    progress_callback=report_progress,
                )
            )
        
        # Add compute mode to result
        result["compute_mode"] = "cloud" if use_cloud else "local"

        job_manager.update_progress(job_id, {
            "message": "Optimization complete",
            "workers_completed": result["workers_used"],
            "workers_total": result["workers_used"],
            "scenarios_evaluated": result["total_scenarios_evaluated"],
            "iterations_completed": result["total_iterations"],
            "best_score": result["best_score"],
        })
        
        job_manager.set_result(job_id, result)
        
    except Exception as e:
        job_manager.set_error(job_id, str(e))

