"""
Job management for optimization requests.
"""

import uuid
import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Optional
from datetime import datetime


class JobStatus(str, Enum):
    QUEUED = "queued"
    RUNNING = "running"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Job:
    """Optimization job."""
    job_id: str
    status: JobStatus
    created_at: float
    started_at: Optional[float] = None
    completed_at: Optional[float] = None
    config: dict = field(default_factory=dict)
    result: Optional[dict] = None
    error: Optional[str] = None
    progress: dict = field(default_factory=dict)


class JobManager:
    """In-memory job manager."""
    
    def __init__(self):
        self.jobs: dict[str, Job] = {}
    
    def create_job(self, config: dict) -> Job:
        """Create a new optimization job."""
        job_id = str(uuid.uuid4())[:8]
        job = Job(
            job_id=job_id,
            status=JobStatus.QUEUED,
            created_at=time.time(),
            config=config,
            progress={"workers_started": 0, "scenarios_evaluated": 0},
        )
        self.jobs[job_id] = job
        return job
    
    def get_job(self, job_id: str) -> Optional[Job]:
        """Get a job by ID."""
        return self.jobs.get(job_id)
    
    def update_status(self, job_id: str, status: JobStatus) -> None:
        """Update job status."""
        job = self.jobs.get(job_id)
        if job:
            job.status = status
            if status == JobStatus.RUNNING:
                job.started_at = time.time()
            elif status in (JobStatus.COMPLETED, JobStatus.FAILED):
                job.completed_at = time.time()
    
    def update_progress(self, job_id: str, progress: dict) -> None:
        """Update job progress."""
        job = self.jobs.get(job_id)
        if job:
            job.progress.update(progress)
    
    def set_result(self, job_id: str, result: dict) -> None:
        """Set job result."""
        job = self.jobs.get(job_id)
        if job:
            job.result = result
            job.status = JobStatus.COMPLETED
            job.completed_at = time.time()
    
    def set_error(self, job_id: str, error: str) -> None:
        """Set job error."""
        job = self.jobs.get(job_id)
        if job:
            job.error = error
            job.status = JobStatus.FAILED
            job.completed_at = time.time()
    
    def list_jobs(self) -> list[Job]:
        """List all jobs."""
        return list(self.jobs.values())


# Global job manager
job_manager = JobManager()
