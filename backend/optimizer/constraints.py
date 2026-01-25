"""
Constraint validation for crew assignments.
Based on FAA regulations and operational requirements.
"""

from datetime import datetime
from typing import Tuple

from optimizer.types import CrewState, Flight, CrewStatus, CrewRole
from utils.time_utils import parse_datetime, time_to_minutes


# FAA Limits (in minutes)
MAX_DUTY_TIME = 840  # 14 hours
MAX_FLIGHT_TIME = 480  # 8 hours
MIN_REST_HOURS = 10
MAX_CONSECUTIVE_DUTY_DAYS = 6
TURNAROUND_TIME = 45  # minutes


def is_assignment_legal(
    crew: CrewState,
    flight: Flight,
    sim_time: datetime,
    allow_hub_crew: bool = True,
    allow_repositioning: bool = False,  # For search: allow moves that need repositioning
) -> Tuple[bool, str]:
    """
    Check if a crew member can legally operate a flight.
    Returns (is_legal, reason_code).
    
    If allow_repositioning=True, skips location check (crew can deadhead).
    """
    
    # 1. Certification check
    if flight.aircraft not in crew.certifications:
        return False, "not_certified"
    
    # 2. Status check
    if crew.status == CrewStatus.DAY_OFF:
        return False, "day_off"
    
    # 3. Rest requirement (10h minimum, reduced to 8h for operational necessity)
    min_rest = 8 if allow_repositioning else MIN_REST_HOURS
    try:
        last_rest = parse_datetime(crew.last_rest_end)
        hours_since_rest = (sim_time - last_rest).total_seconds() / 3600
        if hours_since_rest < min_rest:
            return False, "insufficient_rest"
    except (ValueError, TypeError):
        pass  # If we can't parse, assume OK
    
    # 4. Duty time limit
    projected_duty = crew.duty_time_today + flight.duration + TURNAROUND_TIME
    if projected_duty > MAX_DUTY_TIME:
        return False, "duty_exceeded"
    
    # 5. Flight time limit
    projected_flight = crew.flight_time_today + flight.duration
    if projected_flight > MAX_FLIGHT_TIME:
        return False, "flight_time_exceeded"
    
    # 6. Consecutive duty days
    if crew.consecutive_duty_days >= MAX_CONSECUTIVE_DUTY_DAYS:
        return False, "max_consecutive_days"
    
    # 7. Location match (can be skipped for repositioning moves)
    if not allow_repositioning:
        HUB = "DFW"
        if crew.current_location != flight.origin:
            if allow_hub_crew and crew.current_location == HUB and flight.origin == HUB:
                pass  # OK - hub crew covering hub flight
            else:
                return False, "wrong_location"
    
    return True, "ok"


def get_required_crew(flight: Flight) -> Tuple[int, int]:
    """Get required pilots and flight attendants for a flight."""
    # Simplified: 2 pilots, 3 FAs for all flights
    # In reality, this depends on aircraft type and passenger count
    return 2, 3


def has_minimum_crew(
    assigned_crew: list[CrewState],
    flight: Flight
) -> Tuple[bool, int, int]:
    """
    Check if flight has minimum required crew.
    Returns (has_minimum, pilots_short, fas_short).
    """
    required_pilots, required_fas = get_required_crew(flight)
    
    current_pilots = sum(1 for c in assigned_crew if c.role == CrewRole.PILOT)
    current_fas = sum(1 for c in assigned_crew if c.role == CrewRole.FLIGHT_ATTENDANT)
    
    pilots_short = max(0, required_pilots - current_pilots)
    fas_short = max(0, required_fas - current_fas)
    
    return pilots_short == 0 and fas_short == 0, pilots_short, fas_short


def check_duty_remaining(crew: CrewState) -> int:
    """Get remaining duty time in minutes."""
    return max(0, MAX_DUTY_TIME - crew.duty_time_today)


def check_flight_time_remaining(crew: CrewState) -> int:
    """Get remaining flight time in minutes."""
    return max(0, MAX_FLIGHT_TIME - crew.flight_time_today)
