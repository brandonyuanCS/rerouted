"""
AWS Lambda client for invoking the crew optimizer.
Provides a drop-in replacement for local parallel optimization.
"""

import json
import os
from typing import Any

try:
    import boto3
    HAS_BOTO3 = True
except ImportError:
    HAS_BOTO3 = False
    boto3 = None

from optimizer.types import Crew, Flight, Pairing, Disruption, AffectedCrew


def serialize_crew(crew: list[Crew]) -> list[dict]:
    """Convert Crew objects to JSON-serializable dicts."""
    return [
        {
            "crewId": c.crew_id,
            "role": c.role.value,
            "name": c.name,
            "homeBase": c.home_base,
            "certifications": c.certifications,
            "seniorityScore": c.seniority_score,
            "status": c.status.value,
            "currentDutyStart": c.current_duty_start,
            "flightTimeToday": c.flight_time_today,
            "dutyTimeToday": c.duty_time_today,
            "consecutiveDutyDays": c.consecutive_duty_days,
            "lastRestEnd": c.last_rest_end,
            "currentLocation": c.current_location,
        }
        for c in crew
    ]


def serialize_flights(flights: list[Flight]) -> list[dict]:
    """Convert Flight objects to JSON-serializable dicts."""
    return [
        {
            "flightNumber": f.flight_number,
            "origin": f.origin,
            "destination": f.destination,
            "aircraft": f.aircraft,
            "aircraftId": f.aircraft_id,
            "scheduledDeparture": f.scheduled_departure,
            "scheduledArrival": f.scheduled_arrival,
            "duration": f.duration,
            "distance": f.distance,
            "typical_passenger_count": f.typical_passenger_count,
        }
        for f in flights
    ]


def serialize_pairings(pairings: list[Pairing]) -> list[dict]:
    """Convert Pairing objects to JSON-serializable dicts."""
    return [
        {
            "pairingId": p.pairing_id,
            "crewId": p.crew_id,
            "flights": p.flights,
            "dutyStart": p.duty_start,
            "dutyEnd": p.duty_end,
            "totalFlightTime": p.total_flight_time,
            "totalDutyTime": p.total_duty_time,
            "returnsToBase": p.returns_to_base,
        }
        for p in pairings
    ]


def serialize_disruptions(disruptions: list[Disruption]) -> list[dict]:
    """Convert Disruption objects to JSON-serializable dicts."""
    return [
        {
            "flightNumber": d.flight_number,
            "type": d.type.value,
            "cause": d.cause.value,
            "originalDeparture": d.original_departure,
            "delayMinutes": d.delay_minutes,
            "newDeparture": d.new_departure,
            "isCascade": d.is_cascade,
            "cascadeSource": d.cascade_source,
        }
        for d in disruptions
    ]


def serialize_affected_crew(affected_crew: list[AffectedCrew]) -> list[dict]:
    """Convert AffectedCrew objects to JSON-serializable dicts."""
    return [
        {
            "crewId": ac.crew_id,
            "originalPairing": ac.original_pairing,
            "impact": ac.impact,
            "currentLocation": ac.current_location,
            "availableFrom": ac.available_from,
        }
        for ac in affected_crew
    ]


def invoke_lambda_optimizer(
    crew: list[Crew],
    flights: list[Flight],
    pairings: list[Pairing],
    disruptions: list[Disruption],
    affected_crew: list[AffectedCrew] = None,
    num_workers: int = 8,
    timeout_seconds: float = 30.0,
) -> dict:
    """
    Invoke AWS Lambda function for crew optimization.
    
    Returns the same format as run_parallel_optimization() for drop-in replacement.
    """
    if not HAS_BOTO3:
        raise RuntimeError("boto3 not installed. Run: pip install boto3")
    
    # Get Lambda config from environment
    function_name = os.environ.get("LAMBDA_FUNCTION_NAME", "crew-optimizer")
    region = os.environ.get("AWS_REGION", "us-east-1")
    
    # Build payload
    payload = {
        "crew": serialize_crew(crew),
        "flights": serialize_flights(flights),
        "pairings": serialize_pairings(pairings),
        "disruptions": serialize_disruptions(disruptions),
        "affected_crew": serialize_affected_crew(affected_crew or []),
        "config": {
            "num_workers": num_workers,
            "timeout_seconds": timeout_seconds,
        }
    }
    
    # Invoke Lambda
    client = boto3.client("lambda", region_name=region)
    
    response = client.invoke(
        FunctionName=function_name,
        InvocationType="RequestResponse",  # Synchronous
        Payload=json.dumps(payload),
    )
    
    # Parse response
    response_payload = json.loads(response["Payload"].read())
    
    if response_payload.get("statusCode") != 200:
        error = response_payload.get("body", {})
        if isinstance(error, str):
            error = json.loads(error)
        raise RuntimeError(f"Lambda error: {error.get('error', 'Unknown error')}")
    
    return response_payload["body"]


def is_cloud_enabled() -> bool:
    """Check if cloud compute is enabled via environment variable."""
    return os.environ.get("USE_CLOUD_COMPUTE", "false").lower() == "true"
