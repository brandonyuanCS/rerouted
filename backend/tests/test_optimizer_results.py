"""Tests for role-aware coverage and result reporting."""

import unittest

from optimizer.results import build_reassignments, compute_solution_metrics
from optimizer.scoring import PENALTY_UNASSIGNED_FLIGHT, score_solution
from optimizer.types import (
    Crew,
    CrewRole,
    CrewState,
    CrewStatus,
    Disruption,
    DisruptionCause,
    DisruptionType,
    Flight,
    Pairing,
    Solution,
)


def make_crew(crew_id: str, role: CrewRole) -> Crew:
    return Crew(
        crew_id=crew_id,
        role=role,
        name=f"Crew {crew_id}",
        home_base="DFW",
        certifications=["738"],
        seniority_score=1,
        status=CrewStatus.AVAILABLE,
        current_duty_start=None,
        flight_time_today=0,
        duty_time_today=0,
        consecutive_duty_days=0,
        last_rest_end="2026-01-24T00:00:00",
        current_location="DFW",
    )


class OptimizerResultTests(unittest.TestCase):
    def setUp(self):
        self.flight = Flight(
            flight_number="AA1000",
            origin="DFW",
            destination="LAX",
            aircraft="738",
            aircraft_id="N100AA",
            scheduled_departure="12:00:00",
            scheduled_arrival="14:00:00",
            duration=120,
            distance=1200,
            typical_passenger_count=160,
        )
        self.disruption = Disruption(
            flight_number="AA1000",
            type=DisruptionType.DELAY,
            cause=DisruptionCause.CREW,
            original_departure="2026-01-24T12:00:00",
            delay_minutes=90,
        )
        self.crew = [
            make_crew("P1", CrewRole.PILOT),
            make_crew("P2", CrewRole.PILOT),
            make_crew("F1", CrewRole.FLIGHT_ATTENDANT),
            make_crew("F2", CrewRole.FLIGHT_ATTENDANT),
            make_crew("F3", CrewRole.FLIGHT_ATTENDANT),
        ]

    def test_metrics_and_reassignments_come_from_solution_diff(self):
        pairings = [
            Pairing(f"PAIR-{member.crew_id}", member.crew_id, ["AA1000"], "11:00", "15:00", 120, 240, False)
            for member in self.crew[:-1]
        ]
        solution = {"assignments": {"AA1000": [member.crew_id for member in self.crew]}}

        changes = build_reassignments(solution, self.crew, [self.flight], pairings, [self.disruption])
        metrics = compute_solution_metrics(solution, changes, self.crew, pairings, [self.disruption])

        self.assertEqual([change["crew_id"] for change in changes], ["F3"])
        self.assertEqual(metrics["flights_recovered"], 1)
        self.assertEqual(metrics["crew_reassigned"], 1)
        self.assertEqual(metrics["coverage_rate"], 1.0)

    def test_five_crew_with_wrong_roles_is_not_valid_coverage(self):
        pilots = [make_crew(f"P{index}", CrewRole.PILOT) for index in range(5)]
        states = {member.crew_id: CrewState.from_crew(member) for member in pilots}
        solution = Solution(
            assignments={"AA1000": list(states)},
            crew_states=states,
        )

        score = score_solution(solution, [self.disruption], {"AA1000": self.flight})
        self.assertGreaterEqual(score, PENALTY_UNASSIGNED_FLIGHT)


if __name__ == "__main__":
    unittest.main()
