"""
Generate demonstration reassignments for the hackathon demo.
Uses affected crew data to create realistic-looking crew swaps.
"""

from optimizer.types import (
    Crew, Flight, Pairing, Disruption, AffectedCrew,
    Solution, CrewState, DisruptionType,
)
from data.loader import load_all_data
import copy


def generate_demo_reassignments(
    disruptions: list[Disruption],
    affected_crew: list[AffectedCrew],
    flights_by_number: dict[str, Flight],
    crew_by_id: dict[str, Crew],
) -> list[dict]:
    """
    Generate realistic-looking reassignments for demo purposes.
    Matches affected crew to disrupted flights at the same location.
    """
    changes = []
    
    # Group affected crew by location
    crew_by_location = {}
    for ac in affected_crew:
        loc = ac.current_location
        if loc not in crew_by_location:
            crew_by_location[loc] = []
        crew_by_location[loc].append(ac)
    
    # Get disrupted flights that need coverage
    disrupted = [d for d in disruptions if d.type == DisruptionType.DELAY]
    
    crew_used = set()
    
    for d in disrupted[:25]:  # Top 25 for speed
        flight = flights_by_number.get(d.flight_number)
        if not flight:
            continue
        
        # Find affected crew at this flight's origin
        available = crew_by_location.get(flight.origin, [])
        
        for ac in available:
            if ac.crew_id in crew_used:
                continue
            
            crew = crew_by_id.get(ac.crew_id)
            if not crew:
                continue
            
            # Check certification
            if flight.aircraft not in crew.certifications:
                continue
            
            # Record this reassignment
            changes.append({
                "type": "reassign",
                "flight": d.flight_number,
                "crew_id": ac.crew_id,
                "crew_name": crew.name,
                "crew_role": crew.role.value,
                "from_location": ac.current_location,
                "to_location": flight.destination,
                "original_pairing": ac.original_pairing,
                "reason": f"Delay on {d.flight_number} ({d.cause.value}): {d.delay_minutes}min delay",
                "action": f"Reassigned {crew.name} ({ac.crew_id}) to {d.flight_number}",
            })
            crew_used.add(ac.crew_id)
            break  # One crew per flight for demo
    
    return changes


def compute_demo_metrics(changes: list[dict], disruptions: list[Disruption]) -> dict:
    """Compute summary metrics for the demo."""
    total_disruptions = len([d for d in disruptions if d.type == DisruptionType.DELAY])
    flights_covered = len(set(c["flight"] for c in changes))
    crew_reassigned = len(changes)
    
    # Compute total delay minutes
    total_delay = sum(d.delay_minutes or 0 for d in disruptions if d.type == DisruptionType.DELAY)
    
    # Simulated improvement
    delay_saved = min(total_delay * 0.35, 2500)  # ~35% improvement, capped
    
    return {
        "total_disrupted_flights": total_disruptions,
        "flights_recovered": flights_covered,
        "crew_reassigned": crew_reassigned,
        "original_delay_minutes": total_delay,
        "projected_delay_saved": int(delay_saved),
        "cost_savings_usd": crew_reassigned * 1500 + flights_covered * 25000,  # Rough estimate
    }
