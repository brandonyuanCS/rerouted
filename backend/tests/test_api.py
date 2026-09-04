"""Regression tests for dashboard API resources."""

import asyncio
import unittest

from api.routes import (
    get_crew,
    get_data_summary,
    get_disruptions,
    get_flights,
    get_pairings,
)


class DashboardApiTests(unittest.TestCase):
    def test_large_dataset_resources_are_consistent(self):
        summary = asyncio.run(get_data_summary())
        flights = asyncio.run(get_flights())
        crew = asyncio.run(get_crew())
        pairings = asyncio.run(get_pairings())
        disruptions = asyncio.run(get_disruptions())

        self.assertEqual(len(flights), summary.total_flights)
        self.assertEqual(len(crew), summary.total_crew)
        self.assertEqual(len(pairings), summary.total_pairings)
        self.assertEqual(len(disruptions), summary.total_disruptions)

    def test_disruptions_are_joined_to_real_flight_routes(self):
        flights = {
            flight["flight_number"]: flight
            for flight in asyncio.run(get_flights())
        }
        disruptions = asyncio.run(get_disruptions())

        self.assertGreater(len(disruptions), 0)
        for disruption in disruptions:
            flight = flights[disruption["flight_number"]]
            self.assertEqual(disruption["origin"], flight["origin"])
            self.assertEqual(disruption["destination"], flight["destination"])


if __name__ == "__main__":
    unittest.main()
