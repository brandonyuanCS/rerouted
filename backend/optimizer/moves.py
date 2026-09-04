"""
Move generation and application for tabu search.
"""

import copy
import random
from datetime import datetime
from typing import Generator

from optimizer.types import (
    Solution, CrewState, Flight, Disruption,
    ReassignMove, SwapMove, RemoveMove, Move,
    DisruptionType, CrewRole,
)
from optimizer.constraints import has_minimum_crew, is_assignment_legal


def generate_neighborhood(
    solution: Solution,
    disruptions: list[Disruption],
    flights_by_number: dict[str, Flight],
    sim_time: datetime,
    max_moves: int = 50,
    seed: int = 42,
) -> Generator[Move, None, None]:
    """
    Generate candidate moves for neighborhood exploration.
    Yields up to max_moves moves.
    
    Each worker should use a different seed to explore different neighborhoods.
    """
    # Seed RNG for this worker so each explores differently
    rng = random.Random(seed)
    
    moves_generated = 0
    
    # Get disrupted flights that need crew (shuffled for diversity)
    disrupted_flights = [
        d.flight_number for d in disruptions
        if d.type == DisruptionType.DELAY
    ]
    rng.shuffle(disrupted_flights)
    
    # Priority 1: Reassign available crew to uncovered flights
    for flight_num in disrupted_flights:
        if moves_generated >= max_moves:
            return
            
        flight = flights_by_number.get(flight_num)
        if not flight:
            continue
        
        current_crew = solution.assignments.get(flight_num, [])
        current_states = [
            solution.crew_states[crew_id]
            for crew_id in current_crew
            if crew_id in solution.crew_states
        ]
        if has_minimum_crew(current_states, flight)[0]:
            continue
        
        # Find available crew at this location
        for crew_id, state in solution.crew_states.items():
            if crew_id in current_crew:
                continue
            
            legal, _ = is_assignment_legal(state, flight, sim_time, allow_repositioning=True)
            if legal:
                yield ReassignMove(flight_number=flight_num, crew_id=crew_id)
                moves_generated += 1
                
                if moves_generated >= max_moves:
                    return
    
    # Priority 2: Swap moves between disrupted and non-disrupted flights
    for flight_num in disrupted_flights:
        if moves_generated >= max_moves:
            return
            
        flight = flights_by_number.get(flight_num)
        if not flight:
            continue
        
        # Find crew on other flights at same location who could swap
        for other_flight_num, other_crew_ids in solution.assignments.items():
            if other_flight_num == flight_num:
                continue
            
            other_flight = flights_by_number.get(other_flight_num)
            if not other_flight or other_flight.origin != flight.origin:
                continue
            
            for other_crew_id in other_crew_ids:
                other_state = solution.crew_states.get(other_crew_id)
                if not other_state:
                    continue
                
                # Check if they can operate our disrupted flight
                legal, _ = is_assignment_legal(other_state, flight, sim_time, allow_repositioning=True)
                if legal:
                    # Find someone from disrupted flight who can take their place
                    for our_crew_id in solution.assignments.get(flight_num, []):
                        our_state = solution.crew_states.get(our_crew_id)
                        if not our_state:
                            continue
                        
                        legal2, _ = is_assignment_legal(our_state, other_flight, sim_time, allow_repositioning=True)
                        if legal2:
                            yield SwapMove(
                                flight_a=flight_num,
                                crew_a=our_crew_id,
                                flight_b=other_flight_num,
                                crew_b=other_crew_id,
                            )
                            moves_generated += 1
                            
                            if moves_generated >= max_moves:
                                return


def apply_move(
    solution: Solution,
    move: Move,
    flights_by_number: dict[str, Flight],
) -> Solution:
    """
    Apply a move to create a new solution.
    Returns a deep copy with the move applied.
    """
    new_solution = Solution(
        assignments=copy.deepcopy(solution.assignments),
        crew_states=copy.deepcopy(solution.crew_states),
        objective=solution.objective,
        unassigned_flights=solution.unassigned_flights.copy(),
        reassignment_count=solution.reassignment_count,
        original_assignments=copy.deepcopy(solution.original_assignments),
        changes=copy.deepcopy(solution.changes),
    )
    
    if isinstance(move, ReassignMove):
        _apply_reassign(new_solution, move, flights_by_number)
        _refresh_coverage(new_solution, move.flight_number, flights_by_number)
    elif isinstance(move, SwapMove):
        _apply_swap(new_solution, move, flights_by_number)
        _refresh_coverage(new_solution, move.flight_a, flights_by_number)
        _refresh_coverage(new_solution, move.flight_b, flights_by_number)
    elif isinstance(move, RemoveMove):
        _apply_remove(new_solution, move, flights_by_number)
        _refresh_coverage(new_solution, move.flight_number, flights_by_number)
    
    return new_solution


def _refresh_coverage(
    solution: Solution,
    flight_number: str,
    flights_by_number: dict[str, Flight],
) -> None:
    """Keep the solution's uncovered-flight index consistent after a move."""
    flight = flights_by_number.get(flight_number)
    if not flight:
        return

    assigned = [
        solution.crew_states[crew_id]
        for crew_id in solution.assignments.get(flight_number, [])
        if crew_id in solution.crew_states
    ]
    covered = has_minimum_crew(assigned, flight)[0]
    if covered and flight_number in solution.unassigned_flights:
        solution.unassigned_flights.remove(flight_number)


def _apply_reassign(
    solution: Solution,
    move: ReassignMove,
    flights_by_number: dict[str, Flight],
) -> None:
    """Apply a reassignment move in-place."""
    flight = flights_by_number.get(move.flight_number)
    if not flight:
        return
    
    # Add crew to flight
    if move.flight_number not in solution.assignments:
        solution.assignments[move.flight_number] = []
    
    if move.crew_id not in solution.assignments[move.flight_number]:
        solution.assignments[move.flight_number].append(move.crew_id)
        solution.reassignment_count += 1
        
        # Track this change
        solution.changes.append({
            "type": "reassign",
            "flight": move.flight_number,
            "crew_id": move.crew_id,
            "action": f"Assigned {move.crew_id} to {move.flight_number}",
        })
    
    # Update crew state
    crew_state = solution.crew_states.get(move.crew_id)
    if crew_state:
        crew_state.assigned_flights.append(move.flight_number)
        crew_state.duty_time_today += flight.duration + 45
        crew_state.flight_time_today += flight.duration
        crew_state.current_location = flight.destination


def _apply_swap(
    solution: Solution,
    move: SwapMove,
    flights_by_number: dict[str, Flight],
) -> None:
    """Apply a swap move in-place."""
    flight_a = flights_by_number.get(move.flight_a)
    flight_b = flights_by_number.get(move.flight_b)
    
    if not flight_a or not flight_b:
        return
    
    # Swap in assignments
    if move.crew_a in solution.assignments.get(move.flight_a, []):
        solution.assignments[move.flight_a].remove(move.crew_a)
        solution.assignments.setdefault(move.flight_b, []).append(move.crew_a)
    
    if move.crew_b in solution.assignments.get(move.flight_b, []):
        solution.assignments[move.flight_b].remove(move.crew_b)
        solution.assignments.setdefault(move.flight_a, []).append(move.crew_b)
    
    # Update crew states
    state_a = solution.crew_states.get(move.crew_a)
    state_b = solution.crew_states.get(move.crew_b)
    
    if state_a:
        if move.flight_a in state_a.assigned_flights:
            state_a.assigned_flights.remove(move.flight_a)
        state_a.assigned_flights.append(move.flight_b)
        state_a.current_location = flight_b.destination
    
    if state_b:
        if move.flight_b in state_b.assigned_flights:
            state_b.assigned_flights.remove(move.flight_b)
        state_b.assigned_flights.append(move.flight_a)
        state_b.current_location = flight_a.destination
    
    solution.reassignment_count += 2


def _apply_remove(
    solution: Solution,
    move: RemoveMove,
    flights_by_number: dict[str, Flight],
) -> None:
    """Apply a remove move in-place."""
    if move.crew_id in solution.assignments.get(move.flight_number, []):
        solution.assignments[move.flight_number].remove(move.crew_id)
    
    crew_state = solution.crew_states.get(move.crew_id)
    if crew_state and move.flight_number in crew_state.assigned_flights:
        crew_state.assigned_flights.remove(move.flight_number)
