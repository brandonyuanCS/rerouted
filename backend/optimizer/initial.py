"""
Initial solution generator.
Creates a starting solution from existing pairings.
"""

import copy
from datetime import datetime

from optimizer.types import (
    Solution, CrewState, Crew, Flight, Pairing, Disruption,
    DisruptionType, CrewRole,
)
from optimizer.constraints import is_assignment_legal


def generate_initial_solution(
    crew: list[Crew],
    flights: list[Flight],
    pairings: list[Pairing],
    disruptions: list[Disruption],
    sim_time: datetime,
) -> Solution:
    """
    Build starting solution from current pairings + greedy assignment.
    """
    # Build lookups
    flights_by_number = {f.flight_number: f for f in flights}
    
    # Initialize crew states
    crew_states = {c.crew_id: CrewState.from_crew(c) for c in crew}
    
    # Load existing pairings into assignments
    assignments: dict[str, list[str]] = {}
    
    for pairing in pairings:
        for flight_num in pairing.flights:
            if flight_num not in assignments:
                assignments[flight_num] = []
            if pairing.crew_id not in assignments[flight_num]:
                assignments[flight_num].append(pairing.crew_id)
                crew_states[pairing.crew_id].assigned_flights.append(flight_num)
    
    # Identify disrupted flights needing crew
    disrupted_flight_nums = {
        d.flight_number for d in disruptions
        if d.type == DisruptionType.DELAY
    }
    
    unassigned = []
    for flight_num in disrupted_flight_nums:
        current = assignments.get(flight_num, [])
        if len(current) < 5:  # Need 2 pilots + 3 FAs
            unassigned.append(flight_num)
    
    # Greedy initial assignment for uncovered flights
    for flight_num in unassigned:
        flight = flights_by_number.get(flight_num)
        if not flight:
            continue
        
        # Find available crew at this location
        available = _find_available_crew(
            flight, crew_states, sim_time, assignments.get(flight_num, [])
        )
        
        # Assign up to 5 crew (2 pilots + 3 FAs)
        pilots_needed = 2
        fas_needed = 3
        
        for crew_id in available:
            if pilots_needed == 0 and fas_needed == 0:
                break
            
            state = crew_states[crew_id]
            
            if state.role == CrewRole.PILOT and pilots_needed > 0:
                _assign_crew(assignments, crew_states, flight_num, crew_id, flight)
                pilots_needed -= 1
            elif state.role == CrewRole.FLIGHT_ATTENDANT and fas_needed > 0:
                _assign_crew(assignments, crew_states, flight_num, crew_id, flight)
                fas_needed -= 1
    
    # Recalculate unassigned
    final_unassigned = [
        f for f in disrupted_flight_nums
        if len(assignments.get(f, [])) < 5
    ]
    
    return Solution(
        assignments=assignments,
        crew_states=crew_states,
        objective=float("inf"),
        unassigned_flights=final_unassigned,
        reassignment_count=0,
        original_assignments=copy.deepcopy(assignments),  # Store original for diff
        changes=[],
    )


def _find_available_crew(
    flight: Flight,
    crew_states: dict[str, CrewState],
    sim_time: datetime,
    already_assigned: list[str],
) -> list[str]:
    """Find crew members available for a flight."""
    available = []
    
    for crew_id, state in crew_states.items():
        if crew_id in already_assigned:
            continue
        
        # Check if they can operate this flight
        legal, _ = is_assignment_legal(state, flight, sim_time)
        if legal:
            available.append(crew_id)
    
    # Sort by seniority (prefer less senior for reassignment)
    return available


def _assign_crew(
    assignments: dict[str, list[str]],
    crew_states: dict[str, CrewState],
    flight_num: str,
    crew_id: str,
    flight: Flight,
) -> None:
    """Assign a crew member to a flight."""
    if flight_num not in assignments:
        assignments[flight_num] = []
    
    if crew_id not in assignments[flight_num]:
        assignments[flight_num].append(crew_id)
    
    state = crew_states[crew_id]
    if flight_num not in state.assigned_flights:
        state.assigned_flights.append(flight_num)
        state.duty_time_today += flight.duration + 45
        state.flight_time_today += flight.duration
        state.current_location = flight.destination
