"""
Type definitions for the crew optimization problem.
Maps to JSON schemas from data/output/*.json
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class CrewRole(str, Enum):
    PILOT = "pilot"
    FLIGHT_ATTENDANT = "flightAttendant"


class CrewStatus(str, Enum):
    AVAILABLE = "available"
    ON_DUTY = "on_duty"
    RESTING = "resting"
    DAY_OFF = "day_off"


class DisruptionType(str, Enum):
    DELAY = "delay"
    CANCELLATION = "cancellation"


class DisruptionCause(str, Enum):
    WEATHER = "weather"
    MECHANICAL = "mechanical"
    CREW = "crew"
    ATC = "atc"
    LATE_AIRCRAFT = "late_aircraft"


@dataclass
class Crew:
    """Crew member from crew.json"""
    crew_id: str
    role: CrewRole
    name: str
    home_base: str
    certifications: list[str]
    seniority_score: int
    status: CrewStatus
    current_duty_start: Optional[str]
    flight_time_today: int  # minutes
    duty_time_today: int  # minutes
    consecutive_duty_days: int
    last_rest_end: str
    current_location: str


@dataclass
class Flight:
    """Flight from flights_enriched.json"""
    flight_number: str
    origin: str
    destination: str
    aircraft: str
    aircraft_id: str
    scheduled_departure: str  # HH:MM:SS
    scheduled_arrival: str
    duration: int  # minutes
    distance: int
    typical_passenger_count: int


@dataclass
class Pairing:
    """Crew pairing from crew_pairings.json"""
    pairing_id: str
    crew_id: str
    flights: list[str]
    duty_start: str
    duty_end: str
    total_flight_time: int
    total_duty_time: int
    returns_to_base: bool


@dataclass
class Disruption:
    """Disruption from disruptions.json"""
    flight_number: str
    type: DisruptionType
    cause: DisruptionCause
    original_departure: str
    delay_minutes: Optional[int] = None
    new_departure: Optional[str] = None
    is_cascade: bool = False
    cascade_source: Optional[str] = None


@dataclass
class AffectedCrew:
    """Affected crew member from disruptions.json"""
    crew_id: str
    original_pairing: list[str]
    impact: str  # 'delayed', 'stranded', 'timeout'
    current_location: str
    available_from: str


# Optimization types

@dataclass
class CrewState:
    """Mutable crew state during optimization."""
    crew_id: str
    role: CrewRole
    current_location: str
    home_base: str
    certifications: list[str]
    duty_time_today: int
    flight_time_today: int
    consecutive_duty_days: int
    last_rest_end: str
    status: CrewStatus
    assigned_flights: list[str] = field(default_factory=list)

    @classmethod
    def from_crew(cls, crew: Crew) -> "CrewState":
        return cls(
            crew_id=crew.crew_id,
            role=crew.role,
            current_location=crew.current_location,
            home_base=crew.home_base,
            certifications=crew.certifications.copy(),
            duty_time_today=crew.duty_time_today,
            flight_time_today=crew.flight_time_today,
            consecutive_duty_days=crew.consecutive_duty_days,
            last_rest_end=crew.last_rest_end,
            status=crew.status,
            assigned_flights=[],
        )


@dataclass
class Assignment:
    """A crew-to-flight assignment."""
    flight_number: str
    crew_id: str
    is_new: bool = False  # True if this is a reassignment from optimization


@dataclass
class Solution:
    """Complete solution state."""
    assignments: dict[str, list[str]]  # flight_number -> list of crew_ids
    crew_states: dict[str, CrewState]
    objective: float = float("inf")
    unassigned_flights: list[str] = field(default_factory=list)
    reassignment_count: int = 0
    original_assignments: dict[str, list[str]] = field(default_factory=dict)  # For change tracking
    changes: list[dict] = field(default_factory=list)  # List of {type, flight, crew, reason}


# Move types

@dataclass
class ReassignMove:
    """Assign crew to a flight."""
    flight_number: str
    crew_id: str

    def key(self) -> str:
        return f"REASSIGN:{self.crew_id}->{self.flight_number}"


@dataclass
class SwapMove:
    """Swap crew between two flights."""
    flight_a: str
    crew_a: str
    flight_b: str
    crew_b: str

    def key(self) -> str:
        return f"SWAP:{self.crew_a}<->{self.crew_b}"


@dataclass
class RemoveMove:
    """Remove crew from a flight (to free them for reassignment)."""
    flight_number: str
    crew_id: str

    def key(self) -> str:
        return f"REMOVE:{self.crew_id}<-{self.flight_number}"


Move = ReassignMove | SwapMove | RemoveMove


@dataclass
class SearchStats:
    """Statistics from a tabu search run."""
    iterations: int
    best_score: float
    moves_evaluated: int
    improvements: int
    termination_reason: str


@dataclass
class OptimizationResult:
    """Result from optimization."""
    solution: Solution
    stats: SearchStats
    worker_id: int = 0
    scenarios_evaluated: int = 0
