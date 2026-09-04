"""
AWS Lambda handler for crew optimization.
Receives data via event payload, runs parallel tabu search, returns results.
"""

import json
import concurrent.futures
from datetime import datetime
from typing import Any

# Import optimizer modules (will be packaged with Lambda)
from optimizer.types import (
    Crew, CrewRole, CrewStatus,
    Flight, Pairing, Disruption,
    DisruptionType, DisruptionCause,
)
from optimizer.search import tabu_search, TabuConfig
from optimizer.results import build_reassignments, compute_solution_metrics


# Tabu tenures for worker diversity
TENURE_OPTIONS = [5, 7, 10, 12, 15]


def deserialize_crew(data: list[dict]) -> list[Crew]:
    """Convert JSON crew data to Crew objects."""
    return [
        Crew(
            crew_id=c["crewId"],
            role=CrewRole(c["role"]),
            name=c["name"],
            home_base=c.get("homeBase", c.get("base", "")),
            certifications=c["certifications"],
            seniority_score=c.get("seniorityScore", c.get("seniority", 0)),
            status=CrewStatus(c["status"]),
            current_duty_start=c.get("currentDutyStart"),
            flight_time_today=c["flightTimeToday"],
            duty_time_today=c["dutyTimeToday"],
            consecutive_duty_days=c["consecutiveDutyDays"],
            last_rest_end=c["lastRestEnd"],
            current_location=c["currentLocation"],
        )
        for c in data
    ]


def deserialize_flights(data: list[dict]) -> list[Flight]:
    """Convert JSON flight data to Flight objects."""
    return [
        Flight(
            flight_number=f["flightNumber"],
            origin=f["origin"],
            destination=f["destination"],
            aircraft=f["aircraft"],
            aircraft_id=f.get("aircraftId", f["flightNumber"]),
            scheduled_departure=f["scheduledDeparture"],
            scheduled_arrival=f["scheduledArrival"],
            duration=f["duration"],
            distance=f.get("distance", 500),
            typical_passenger_count=f.get("typical_passenger_count", 150),
        )
        for f in data
    ]


def deserialize_pairings(data: list[dict]) -> list[Pairing]:
    """Convert JSON pairing data to Pairing objects."""
    return [
        Pairing(
            pairing_id=p["pairingId"],
            crew_id=p["crewId"],
            flights=p["flights"],
            duty_start=p["dutyStart"],
            duty_end=p["dutyEnd"],
            total_flight_time=p["totalFlightTime"],
            total_duty_time=p["totalDutyTime"],
            returns_to_base=p["returnsToBase"],
        )
        for p in data
    ]


def deserialize_disruptions(data: list[dict]) -> list[Disruption]:
    """Convert JSON disruption data to Disruption objects."""
    return [
        Disruption(
            flight_number=d["flightNumber"],
            type=DisruptionType(d["type"]),
            cause=DisruptionCause(d["cause"]),
            original_departure=d["originalDeparture"],
            delay_minutes=d.get("delayMinutes"),
            new_departure=d.get("newDeparture"),
            is_cascade=d.get("isCascade", False),
            cascade_source=d.get("cascadeSource"),
        )
        for d in data
    ]


def run_worker(args: tuple) -> dict:
    """Run a single tabu search worker."""
    crew, flights, pairings, disruptions, base_config, worker_id, sim_time = args
    
    config = TabuConfig(
        max_iterations=base_config.get("max_iterations", 200),
        max_no_improve=base_config.get("max_no_improve", 30),
        max_seconds=base_config.get("max_seconds", 30.0),
        tabu_tenure=TENURE_OPTIONS[worker_id % len(TENURE_OPTIONS)],
        neighborhood_size=base_config.get("neighborhood_size", 50),
        seed=base_config.get("seed", 42) + worker_id,
    )
    
    result = tabu_search(crew, flights, pairings, disruptions, config, sim_time)
    
    return {
        "worker_id": worker_id,
        "best_score": result.solution.objective,
        "iterations": result.stats.iterations,
        "moves_evaluated": result.stats.moves_evaluated,
        "improvements": result.stats.improvements,
        "termination_reason": result.stats.termination_reason,
        "reassignment_count": result.solution.reassignment_count,
        "unassigned_count": len(result.solution.unassigned_flights),
        "solution": {
            "assignments": result.solution.assignments,
            "objective": result.solution.objective,
            "unassigned_flights": result.solution.unassigned_flights,
            "reassignment_count": result.solution.reassignment_count,
            "changes": result.solution.changes,
        },
    }


def handler(event: dict, context: Any) -> dict:
    """
    AWS Lambda handler for crew optimization.
    
    Expected event structure:
    {
        "crew": [...],           # Raw JSON crew data
        "flights": [...],        # Raw JSON flight data
        "pairings": [...],       # Raw JSON pairing data
        "disruptions": [...],    # Raw JSON disruption data
        "config": {              # Optional config overrides
            "num_workers": 8,
            "timeout_seconds": 30.0
        }
    }
    """
    try:
        # Parse configuration
        config = event.get("config", {})
        num_workers = config.get("num_workers", 8)
        timeout_seconds = config.get("timeout_seconds", 30.0)
        
        # Deserialize data
        crew = deserialize_crew(event["crew"])
        flights = deserialize_flights(event["flights"])
        pairings = deserialize_pairings(event["pairings"])
        disruptions = deserialize_disruptions(event["disruptions"])
        
        # Simulation time (3PM gives 10+ hours since morning rest)
        sim_time = datetime(2026, 1, 24, 15, 0, 0)
        
        base_config = {
            "max_iterations": 200,
            "max_no_improve": 30,
            "max_seconds": timeout_seconds,
            "neighborhood_size": 50,
            "seed": 42,
        }
        
        # Prepare worker arguments
        worker_args = [
            (crew, flights, pairings, disruptions, base_config, i, sim_time)
            for i in range(num_workers)
        ]
        
        # Run parallel workers using ThreadPoolExecutor
        # (Lambda uses threads, not processes, due to /tmp constraints)
        results = []
        with concurrent.futures.ThreadPoolExecutor(max_workers=num_workers) as executor:
            futures = {executor.submit(run_worker, args): i for i, args in enumerate(worker_args)}
            for future in concurrent.futures.as_completed(futures):
                try:
                    results.append(future.result())
                except Exception as e:
                    print(f"Worker error: {e}")
        
        if not results:
            return {
                "statusCode": 500,
                "body": json.dumps({"error": "No results from workers"})
            }
        
        # Find best result
        best = min(results, key=lambda r: r["best_score"])
        
        # Compute aggregates
        total_iterations = sum(r["iterations"] for r in results)
        total_moves = sum(r["moves_evaluated"] for r in results)
        
        reassignments = build_reassignments(
            best["solution"], crew, flights, pairings, disruptions
        )
        metrics = compute_solution_metrics(
            best["solution"], reassignments, crew, pairings, disruptions
        )
        
        return {
            "statusCode": 200,
            "body": {
                "best_solution": best["solution"],
                "best_score": best["best_score"],
                "best_worker_id": best["worker_id"],
                "total_scenarios_evaluated": total_moves,
                "total_iterations": total_iterations,
                "workers_used": len(results),
                "reassignments": reassignments,
                "metrics": metrics,
                "per_worker_results": [
                    {
                        "worker_id": r["worker_id"],
                        "score": r["best_score"],
                        "iterations": r["iterations"],
                        "moves": r["moves_evaluated"],
                    }
                    for r in results
                ],
                "execution_context": {
                    "function_name": getattr(context, "function_name", "local"),
                    "memory_limit_mb": getattr(context, "memory_limit_in_mb", "N/A"),
                    "remaining_time_ms": getattr(context, "get_remaining_time_in_millis", lambda: "N/A")(),
                }
            }
        }
        
    except Exception as e:
        import traceback
        return {
            "statusCode": 500,
            "body": json.dumps({
                "error": str(e),
                "traceback": traceback.format_exc()
            })
        }


# For local testing
if __name__ == "__main__":
    # Test with minimal data
    test_event = {
        "crew": [],
        "flights": [],
        "pairings": [],
        "disruptions": [],
        "config": {"num_workers": 2, "timeout_seconds": 5.0}
    }
    
    class MockContext:
        function_name = "local-test"
        memory_limit_in_mb = 10240
        def get_remaining_time_in_millis(self):
            return 300000
    
    result = handler(test_event, MockContext())
    print(json.dumps(result, indent=2, default=str))
