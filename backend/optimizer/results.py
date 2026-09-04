"""Build human-readable output from an optimizer solution."""

from optimizer.types import Crew, CrewRole, Disruption, Flight, Pairing


def has_required_crew(crew_ids: list[str], crew_by_id: dict[str, Crew]) -> bool:
    """Check the simplified operating minimum of two pilots and three FAs."""
    pilots = sum(
        1 for crew_id in crew_ids
        if crew_id in crew_by_id and crew_by_id[crew_id].role == CrewRole.PILOT
    )
    flight_attendants = sum(
        1 for crew_id in crew_ids
        if crew_id in crew_by_id
        and crew_by_id[crew_id].role == CrewRole.FLIGHT_ATTENDANT
    )
    return pilots >= 2 and flight_attendants >= 3


def build_reassignments(
    solution: dict,
    crew: list[Crew],
    flights: list[Flight],
    pairings: list[Pairing],
    disruptions: list[Disruption],
) -> list[dict]:
    """Describe assignment changes by diffing the winning solution and baseline."""
    crew_by_id = {member.crew_id: member for member in crew}
    flights_by_number = {flight.flight_number: flight for flight in flights}
    disruptions_by_flight = {
        disruption.flight_number: disruption for disruption in disruptions
    }
    baseline: dict[str, set[str]] = {}
    for pairing in pairings:
        for flight_number in pairing.flights:
            baseline.setdefault(flight_number, set()).add(pairing.crew_id)

    reassignments = []
    for flight_number, assigned_crew in solution["assignments"].items():
        flight = flights_by_number.get(flight_number)
        if not flight:
            continue

        for crew_id in sorted(set(assigned_crew) - baseline.get(flight_number, set())):
            member = crew_by_id.get(crew_id)
            if not member:
                continue

            disruption = disruptions_by_flight.get(flight_number)
            reason = "Restore minimum operating crew"
            if disruption:
                reason += f" after {disruption.cause.value} {disruption.type.value}"

            reassignments.append({
                "type": "reassign",
                "flight": flight_number,
                "crew_id": crew_id,
                "crew_name": member.name,
                "crew_role": member.role.value,
                "from_location": member.current_location,
                "to_location": flight.origin,
                "reason": reason,
                "action": f"Assign {member.name} ({crew_id}) to {flight_number}",
            })

    return reassignments


def compute_solution_metrics(
    solution: dict,
    reassignments: list[dict],
    crew: list[Crew],
    pairings: list[Pairing],
    disruptions: list[Disruption],
) -> dict:
    """Calculate metrics directly from baseline and optimized assignments."""
    crew_by_id = {member.crew_id: member for member in crew}
    baseline: dict[str, set[str]] = {}
    for pairing in pairings:
        for flight_number in pairing.flights:
            baseline.setdefault(flight_number, set()).add(pairing.crew_id)

    disrupted_flights = {
        disruption.flight_number for disruption in disruptions
        if disruption.type.value == "delay"
    }
    covered_before = {
        flight_number for flight_number in disrupted_flights
        if has_required_crew(list(baseline.get(flight_number, set())), crew_by_id)
    }
    covered_after = {
        flight_number for flight_number in disrupted_flights
        if has_required_crew(
            solution["assignments"].get(flight_number, []), crew_by_id
        )
    }
    recovered = covered_after - covered_before
    total = len(disrupted_flights)

    return {
        "total_disrupted_flights": total,
        "flights_recovered": len(recovered),
        "covered_disrupted_flights": len(covered_after),
        "uncovered_disrupted_flights": total - len(covered_after),
        "coverage_rate": round(len(covered_after) / total, 4) if total else 1.0,
        "crew_reassigned": len({item["crew_id"] for item in reassignments}),
        "original_delay_minutes": sum(
            disruption.delay_minutes or 0 for disruption in disruptions
        ),
    }
