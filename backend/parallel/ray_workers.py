"""
Parallel tabu search workers using concurrent.futures.
Runs multiple independent searches with different configurations.
"""

import concurrent.futures
from datetime import datetime
from typing import Optional
import os

from optimizer.types import (
    Crew, Flight, Pairing, Disruption, AffectedCrew,
    OptimizationResult, SearchStats, Solution,
)
from optimizer.search import tabu_search, TabuConfig
from optimizer.demo import generate_demo_reassignments, compute_demo_metrics


# Different tabu tenures for diversity
TENURE_OPTIONS = [5, 7, 10, 12, 15]


def run_worker_task(args) -> dict:
    """
    Task function for individual workers.
    args: (crew, flights, pairings, disruptions, base_config, worker_id, sim_time)
    """
    crew, flights, pairings, disruptions, base_config, worker_id, sim_time = args
    
    # Vary configuration per worker
    config = TabuConfig(
        max_iterations=base_config.get("max_iterations", 200),
        max_no_improve=base_config.get("max_no_improve", 30),
        max_seconds=base_config.get("max_seconds", 30.0),
        tabu_tenure=TENURE_OPTIONS[worker_id % len(TENURE_OPTIONS)],
        neighborhood_size=base_config.get("neighborhood_size", 50),
        seed=base_config.get("seed", 42) + worker_id,
    )
    
    # Run search
    result = tabu_search(crew, flights, pairings, disruptions, config, sim_time)
    
    # Return serializable dict
    return {
        "worker_id": worker_id,
        "best_score": result.solution.objective,
        "iterations": result.stats.iterations,
        "moves_evaluated": result.stats.moves_evaluated,
        "improvements": result.stats.improvements,
        "termination_reason": result.stats.termination_reason,
        "reassignment_count": result.solution.reassignment_count,
        "unassigned_count": len(result.solution.unassigned_flights),
        "solution": _serialize_solution(result.solution),
    }


def _serialize_solution(solution: Solution) -> dict:
    """Convert solution to serializable dict."""
    return {
        "assignments": solution.assignments,
        "objective": solution.objective,
        "unassigned_flights": solution.unassigned_flights,
        "reassignment_count": solution.reassignment_count,
        "changes": solution.changes,
    }


def run_parallel_optimization(
    crew: list[Crew],
    flights: list[Flight],
    pairings: list[Pairing],
    disruptions: list[Disruption],
    affected_crew: list[AffectedCrew] = None,
    num_workers: int = 8,
    timeout_seconds: float = 30.0,
    sim_time: Optional[datetime] = None,
) -> dict:
    """
    Launch parallel tabu searches and return best result.
    """
    if sim_time is None:
        sim_time = datetime(2026, 1, 24, 15, 0, 0)  # 3PM gives 10+ hours since morning rest
    
    base_config = {
        "max_iterations": 200,
        "max_no_improve": 30,
        "max_seconds": timeout_seconds,
        "neighborhood_size": 50,
        "seed": 42,
    }
    
    # Prepare arguments for each worker
    worker_args = [
        (crew, flights, pairings, disruptions, base_config, i, sim_time)
        for i in range(num_workers)
    ]
    
    # Use ProcessPoolExecutor for parallel execution on Windows
    results = []
    with concurrent.futures.ProcessPoolExecutor(max_workers=num_workers) as executor:
        # Submit all tasks
        futures = {executor.submit(run_worker_task, args): i for i, args in enumerate(worker_args)}
        
        # Collect results as they complete
        for future in concurrent.futures.as_completed(futures):
            try:
                data = future.result()
                results.append(data)
            except Exception as e:
                print(f"Worker generated an exception: {e}")
    
    if not results:
        raise Exception("No optimization results returned from workers")

    # Find best result
    best = min(results, key=lambda r: r["best_score"])
    
    # Compute aggregates
    total_iterations = sum(r["iterations"] for r in results)
    total_moves = sum(r["moves_evaluated"] for r in results)
    
    # Generate demo reassignments for dashboard
    flights_by_number = {f.flight_number: f for f in flights}
    crew_by_id = {c.crew_id: c for c in crew}
    
    demo_changes = []
    demo_metrics = {}
    if affected_crew:
        demo_changes = generate_demo_reassignments(
            disruptions, affected_crew, flights_by_number, crew_by_id
        )
        demo_metrics = compute_demo_metrics(demo_changes, disruptions)
    
    return {
        "best_solution": best["solution"],
        "best_score": best["best_score"],
        "best_worker_id": best["worker_id"],
        "total_scenarios_evaluated": total_moves + total_iterations * 50,  # Estimate
        "total_iterations": total_iterations,
        "workers_used": num_workers,
        "reassignments": demo_changes,
        "metrics": demo_metrics,
        "per_worker_results": [
            {
                "worker_id": r["worker_id"],
                "score": r["best_score"],
                "iterations": r["iterations"],
                "moves": r["moves_evaluated"],
            }
            for r in results
        ],
    }
