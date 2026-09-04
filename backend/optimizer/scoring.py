"""
Objective function for scoring solutions.
Lower scores are better.
"""

from optimizer.types import Solution, Disruption, DisruptionType
from optimizer.constraints import has_minimum_crew


# Penalty weights
PENALTY_UNASSIGNED_FLIGHT = 10000  # Catastrophic - flight can't operate
PENALTY_SEVERE_DELAY = 500  # > 2 hours
PENALTY_MAJOR_DELAY = 200  # 1-2 hours
PENALTY_MINOR_DELAY = 50  # 30-60 min
PENALTY_REASSIGNMENT = 25  # Each crew move
PENALTY_OVERTIME = 0.5  # Per minute over soft limit
BONUS_HOME_BASE = -10  # Crew ending at home base

SOFT_DUTY_LIMIT = 720  # 12 hours - soft limit for overtime penalty


def score_solution(
    solution: Solution,
    disruptions: list[Disruption],
    flights_by_number: dict
) -> float:
    """
    Calculate objective score for a solution.
    Lower is better.
    """
    score = 0.0
    
    # 1. Uncovered flights (highest penalty)
    disrupted_flights = {
        d.flight_number for d in disruptions 
        if d.type == DisruptionType.DELAY
    }
    
    for flight_num in disrupted_flights:
        assigned = [
            solution.crew_states[crew_id]
            for crew_id in solution.assignments.get(flight_num, [])
            if crew_id in solution.crew_states
        ]
        flight = flights_by_number.get(flight_num)
        if not flight or not has_minimum_crew(assigned, flight)[0]:
            score += PENALTY_UNASSIGNED_FLIGHT
    
    # 2. Delay penalties based on disruption severity
    for d in disruptions:
        if d.type == DisruptionType.DELAY and d.delay_minutes:
            if d.delay_minutes > 120:
                score += PENALTY_SEVERE_DELAY
            elif d.delay_minutes > 60:
                score += PENALTY_MAJOR_DELAY
            elif d.delay_minutes > 30:
                score += PENALTY_MINOR_DELAY
    
    # 3. Reassignment count
    score += solution.reassignment_count * PENALTY_REASSIGNMENT
    
    # 4. Overtime penalties (soft limit)
    for crew_id, state in solution.crew_states.items():
        overtime = max(0, state.duty_time_today - SOFT_DUTY_LIMIT)
        score += overtime * PENALTY_OVERTIME
    
    # 5. Bonus for crew at home base
    for crew_id, state in solution.crew_states.items():
        if state.current_location == state.home_base:
            score += BONUS_HOME_BASE
    
    return score


def calculate_improvement(old_score: float, new_score: float) -> float:
    """Calculate percentage improvement."""
    if old_score == 0:
        return 0.0
    return ((old_score - new_score) / old_score) * 100


def get_solution_metrics(
    solution: Solution,
    disruptions: list[Disruption],
    flights_by_number: dict,
) -> dict:
    """Get human-readable metrics from a solution."""
    disrupted = {d.flight_number for d in disruptions if d.type == DisruptionType.DELAY}
    covered = 0
    for flight_number in disrupted:
        flight = flights_by_number.get(flight_number)
        assigned = [
            solution.crew_states[crew_id]
            for crew_id in solution.assignments.get(flight_number, [])
            if crew_id in solution.crew_states
        ]
        if flight and has_minimum_crew(assigned, flight)[0]:
            covered += 1
    
    return {
        "disrupted_flights": len(disrupted),
        "flights_recovered": covered,
        "reassignments": solution.reassignment_count,
        "objective_score": solution.objective,
        "crew_utilized": len([s for s in solution.crew_states.values() if s.assigned_flights]),
    }
