"""
Data loader for JSON files from data/output/
"""

import json
from pathlib import Path
from typing import Any

from optimizer.types import (
    Crew, CrewRole, CrewStatus,
    Flight, Pairing, Disruption, AffectedCrew,
    DisruptionType, DisruptionCause,
)


def get_data_dir() -> Path:
    """Get path to data/output directory."""
    return Path(__file__).parent.parent.parent / "data" / "output"


def load_json(filename: str) -> Any:
    """Load a JSON file from data/output."""
    path = get_data_dir() / filename
    with open(path, "r") as f:
        return json.load(f)


def load_crew(use_large: bool = False) -> list[Crew]:
    """Load crew members from crew.json or crew_large.json."""
    filename = "crew_large.json" if use_large else "crew.json"
    data = load_json(filename)
    crew_list = []
    
    for c in data["crew"]:
        crew_list.append(Crew(
            crew_id=c["crewId"],
            role=CrewRole(c["role"]),
            name=c["name"],
            home_base=c.get("homeBase", c.get("base")),
            certifications=c["certifications"],
            seniority_score=c.get("seniorityScore", c.get("seniority", 0)),
            status=CrewStatus(c["status"]),
            current_duty_start=c.get("currentDutyStart"),
            flight_time_today=c["flightTimeToday"],
            duty_time_today=c["dutyTimeToday"],
            consecutive_duty_days=c["consecutiveDutyDays"],
            last_rest_end=c["lastRestEnd"],
            current_location=c["currentLocation"],
        ))
    
    return crew_list


def load_flights(use_large: bool = False) -> list[Flight]:
    """Load flights from flights_enriched.json or flights_large.json."""
    filename = "flights_large.json" if use_large else "flights_enriched.json"
    data = load_json(filename)
    flights = []
    
    for f in data:
        flights.append(Flight(
            flight_number=f["flightNumber"],
            origin=f["origin"],
            destination=f["destination"],
            aircraft=f["aircraft"],
            aircraft_id=f.get("aircraftId", f["flightNumber"]),  # Default to flight number
            scheduled_departure=f["scheduledDeparture"],
            scheduled_arrival=f["scheduledArrival"],
            duration=f["duration"],
            distance=f.get("distance", 500),  # Default distance
            typical_passenger_count=f.get("typical_passenger_count", 150),  # Default
        ))
    
    return flights


def load_pairings(use_large: bool = False) -> list[Pairing]:
    """Load crew pairings from crew_pairings.json or pairings_large.json."""
    filename = "pairings_large.json" if use_large else "crew_pairings.json"
    data = load_json(filename)
    pairings = []
    
    for p in data["pairings"]:
        pairings.append(Pairing(
            pairing_id=p["pairingId"],
            crew_id=p["crewId"],
            flights=p["flights"],
            duty_start=p["dutyStart"],
            duty_end=p["dutyEnd"],
            total_flight_time=p["totalFlightTime"],
            total_duty_time=p["totalDutyTime"],
            returns_to_base=p["returnsToBase"],
        ))
    
    return pairings


def load_disruptions(use_scaled: bool = False) -> tuple[list[Disruption], list[AffectedCrew]]:
    """Load disruptions from disruptions.json or disruptions_scaled.json."""
    filename = "disruptions_scaled.json" if use_scaled else "disruptions.json"
    data = load_json(filename)
    
    disruptions = []
    for d in data["disruptions"]:
        disruptions.append(Disruption(
            flight_number=d["flightNumber"],
            type=DisruptionType(d["type"]),
            cause=DisruptionCause(d["cause"]),
            original_departure=d["originalDeparture"],
            delay_minutes=d.get("delayMinutes"),
            new_departure=d.get("newDeparture"),
            is_cascade=d.get("isCascade", False),
            cascade_source=d.get("cascadeSource"),
        ))
    
    affected_crew = []
    for ac in data["affectedCrew"]:
        affected_crew.append(AffectedCrew(
            crew_id=ac["crewId"],
            original_pairing=ac["originalPairing"],
            impact=ac["impact"],
            current_location=ac["currentLocation"],
            available_from=ac["availableFrom"],
        ))
    
    return disruptions, affected_crew


def load_all_data(use_scaled: bool = False, use_large: bool = False) -> dict:
    """Load all data files.
    
    Args:
        use_scaled: If True, use the scaled disruption dataset (182 disruptions)
        use_large: If True, use the large dataset (600 flights, 2400 crew, 350 disruptions)
    """
    if use_large:
        disruptions, affected_crew = load_disruptions_large()
    elif use_scaled:
        disruptions, affected_crew = load_disruptions(use_scaled=True)
    else:
        disruptions, affected_crew = load_disruptions(use_scaled=False)
    
    return {
        "crew": load_crew(use_large=use_large),
        "flights": load_flights(use_large=use_large),
        "pairings": load_pairings(use_large=use_large),
        "disruptions": disruptions,
        "affected_crew": affected_crew,
    }


def load_disruptions_large() -> tuple[list[Disruption], list[AffectedCrew]]:
    """Load disruptions from disruptions_large.json."""
    data = load_json("disruptions_large.json")
    
    disruptions = []
    for d in data["disruptions"]:
        disruptions.append(Disruption(
            flight_number=d["flightNumber"],
            type=DisruptionType(d["type"]),
            cause=DisruptionCause(d["cause"]),
            original_departure=d["originalDeparture"],
            new_departure=d.get("newDeparture"),
            delay_minutes=d.get("delayMinutes"),
            is_cascade=d.get("isCascade", False),
        ))
    
    affected_crew = []
    for ac in data["affectedCrew"]:
        affected_crew.append(AffectedCrew(
            crew_id=ac["crewId"],
            original_pairing=ac["originalPairing"],
            impact=ac["impact"],
            current_location=ac["currentLocation"],
            available_from=ac.get("availableFrom"),
        ))
    
    return disruptions, affected_crew
