"""
Main tabu search algorithm.
"""

import time
from dataclasses import dataclass
from datetime import datetime

from optimizer.types import (
    Solution, Crew, Flight, Pairing, Disruption,
    SearchStats, OptimizationResult, Move,
)
from optimizer.initial import generate_initial_solution
from optimizer.moves import generate_neighborhood, apply_move
from optimizer.scoring import score_solution
from optimizer.tabu import TabuList, aspiration_criterion


@dataclass
class TabuConfig:
    """Configuration for tabu search."""
    max_iterations: int = 200
    max_no_improve: int = 30
    max_seconds: float = 60.0
    tabu_tenure: int = 7
    neighborhood_size: int = 50
    seed: int = 42


def tabu_search(
    crew: list[Crew],
    flights: list[Flight],
    pairings: list[Pairing],
    disruptions: list[Disruption],
    config: TabuConfig,
    sim_time: datetime,
) -> OptimizationResult:
    """
    Run tabu search to optimize crew assignments.
    Returns the best solution found.
    """
    start_time = time.time()
    
    # Build lookups
    flights_by_number = {f.flight_number: f for f in flights}
    
    # Generate initial solution
    current = generate_initial_solution(crew, flights, pairings, disruptions, sim_time)
    current.objective = score_solution(current, disruptions, flights_by_number)
    
    best = current
    best_ever_score = current.objective
    
    # Initialize tabu list
    tabu_list = TabuList(tenure=config.tabu_tenure)
    
    # Stats tracking
    iterations = 0
    no_improve_count = 0
    improvements = 0
    moves_evaluated = 0
    
    while True:
        # Check termination
        elapsed = time.time() - start_time
        should_stop, reason = _should_terminate(
            iterations, config.max_iterations,
            no_improve_count, config.max_no_improve,
            elapsed, config.max_seconds,
        )
        
        if should_stop:
            break
        
        # Generate neighborhood
        best_neighbor = None
        best_neighbor_score = float("inf")
        best_move = None
        
        for move in generate_neighborhood(
            current, disruptions, flights_by_number, sim_time, config.neighborhood_size
        ):
            moves_evaluated += 1
            
            # Check aspiration criterion
            if not aspiration_criterion(
                move, best_neighbor_score, best_ever_score, tabu_list, iterations
            ):
                continue
            
            # Evaluate move
            neighbor = apply_move(current, move, flights_by_number)
            neighbor.objective = score_solution(neighbor, disruptions, flights_by_number)
            
            if neighbor.objective < best_neighbor_score:
                best_neighbor_score = neighbor.objective
                best_neighbor = neighbor
                best_move = move
        
        # No valid moves found
        if best_neighbor is None:
            no_improve_count += 1
            iterations += 1
            continue
        
        # Move to best neighbor
        current = best_neighbor
        
        # Update tabu list
        if best_move:
            tabu_list.add(best_move, iterations)
        
        # Check if global best
        if current.objective < best_ever_score:
            best = current
            best_ever_score = current.objective
            no_improve_count = 0
            improvements += 1
        else:
            no_improve_count += 1
        
        iterations += 1
    
    # Build stats
    stats = SearchStats(
        iterations=iterations,
        best_score=best.objective,
        moves_evaluated=moves_evaluated,
        improvements=improvements,
        termination_reason=reason,
    )
    
    return OptimizationResult(
        solution=best,
        stats=stats,
        scenarios_evaluated=moves_evaluated,
    )


def _should_terminate(
    iteration: int,
    max_iterations: int,
    no_improve: int,
    max_no_improve: int,
    elapsed: float,
    max_seconds: float,
) -> tuple[bool, str]:
    """Check if search should terminate."""
    if iteration >= max_iterations:
        return True, "max_iterations"
    
    if no_improve >= max_no_improve:
        return True, "no_improvement"
    
    if elapsed >= max_seconds:
        return True, "timeout"
    
    return False, ""
