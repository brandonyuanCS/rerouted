"""
Generate a larger synthetic dataset for HPC demonstration.
Creates realistic airline operations data at scale.
"""

import json
import random
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict

random.seed(42)  # Reproducibility

# Configuration - ADJUST THESE FOR SCALE
NUM_FLIGHTS = 600  # Up from 276
NUM_CREW = 2400    # Up from 1014 (ratio: 4 crew per flight)
NUM_DISRUPTIONS = 350  # Up from 182

# Constants
AIRPORTS = ["DFW", "ORD", "CLT", "JFK", "LAX", "MIA", "PHX", "PHL", "DEN", "SEA", "ATL", "BOS"]
HUB = "DFW"
AIRCRAFT_TYPES = ["738", "321", "757", "320", "739"]
FIRST_NAMES = ["James", "John", "Robert", "Michael", "William", "David", "Richard", "Joseph", "Thomas", "Charles", 
               "Mary", "Patricia", "Jennifer", "Linda", "Barbara", "Elizabeth", "Susan", "Jessica", "Sarah", "Karen",
               "Daniel", "Matthew", "Anthony", "Mark", "Donald", "Steven", "Paul", "Andrew", "Joshua", "Kenneth",
               "Nancy", "Betty", "Margaret", "Sandra", "Ashley", "Kimberly", "Emily", "Donna", "Michelle", "Dorothy"]
LAST_NAMES = ["Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller", "Davis", "Rodriguez", "Martinez",
              "Hernandez", "Lopez", "Gonzalez", "Wilson", "Anderson", "Thomas", "Taylor", "Moore", "Jackson", "Martin",
              "Lee", "Perez", "Thompson", "White", "Harris", "Sanchez", "Clark", "Ramirez", "Lewis", "Robinson"]

DISRUPTION_CAUSES = ["weather", "mechanical", "crew", "atc", "late_aircraft"]
DISRUPTION_CAUSE_WEIGHTS = [0.35, 0.20, 0.15, 0.15, 0.15]


def generate_flights(num_flights: int) -> List[Dict]:
    """Generate synthetic flight data."""
    flights = []
    base_date = datetime(2026, 1, 24, 5, 0, 0)
    
    for i in range(num_flights):
        flight_num = f"AA{1000 + i}"
        
        # Generate route (hub-and-spoke model with some point-to-point)
        if random.random() < 0.6:
            # Hub flight
            if random.random() < 0.5:
                origin, destination = HUB, random.choice([a for a in AIRPORTS if a != HUB])
            else:
                origin, destination = random.choice([a for a in AIRPORTS if a != HUB]), HUB
        else:
            # Point-to-point
            origin = random.choice(AIRPORTS)
            destination = random.choice([a for a in AIRPORTS if a != origin])
        
        # Generate times
        dep_hour = 5 + (i % 18)  # Flights from 5am to 11pm
        dep_minute = random.choice([0, 15, 30, 45])
        departure = base_date.replace(hour=dep_hour, minute=dep_minute)
        
        duration = random.randint(60, 300)  # 1-5 hours
        arrival = departure + timedelta(minutes=duration)
        
        flights.append({
            "flightNumber": flight_num,
            "origin": origin,
            "destination": destination,
            "scheduledDeparture": departure.strftime("%H:%M:%S"),
            "scheduledArrival": arrival.strftime("%H:%M:%S"),
            "aircraft": random.choice(AIRCRAFT_TYPES),
            "duration": duration,
            "status": "scheduled",
        })
    
    return flights


def generate_crew(num_crew: int) -> List[Dict]:
    """Generate synthetic crew data."""
    crew = []
    
    # 40% pilots, 60% FAs
    num_pilots = int(num_crew * 0.4)
    
    for i in range(num_crew):
        is_pilot = i < num_pilots
        crew_id = f"PLT{i+1:03d}" if is_pilot else f"FA{i-num_pilots+1:03d}"
        
        # Certifications (pilots get 2-3, FAs get all)
        if is_pilot:
            certs = random.sample(AIRCRAFT_TYPES, random.randint(2, min(4, len(AIRCRAFT_TYPES))))
        else:
            certs = AIRCRAFT_TYPES.copy()
        
        # Status distribution: 85% available, 10% resting, 5% day_off
        status_roll = random.random()
        if status_roll < 0.85:
            status = "available"
        elif status_roll < 0.95:
            status = "resting"
        else:
            status = "day_off"
        
        # Base location (weighted towards hub)
        if random.random() < 0.4:
            base = HUB
        else:
            base = random.choice(AIRPORTS)
        
        crew.append({
            "crewId": crew_id,
            "name": f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            "role": "pilot" if is_pilot else "flightAttendant",
            "base": base,
            "currentLocation": base if status != "resting" else random.choice(AIRPORTS),
            "status": status,
            "certifications": certs,
            "seniority": random.randint(1, 30),
            "dutyTimeToday": random.randint(0, 4) * 60,
            "flightTimeToday": random.randint(0, 3) * 60,
            "consecutiveDutyDays": random.randint(0, 4),
            "lastRestEnd": f"2026-01-24T{random.randint(0,12):02d}:00:00",
        })
    
    return crew


def generate_pairings(flights: List[Dict], crew: List[Dict]) -> List[Dict]:
    """Generate crew pairings for flights."""
    pairings = []
    pairing_id = 1
    
    # Group flights by departure time for sequencing
    sorted_flights = sorted(flights, key=lambda f: f["scheduledDeparture"])
    
    # Assign crew to flights
    pilots = [c for c in crew if c["role"] == "pilot"]
    fas = [c for c in crew if c["role"] == "flightAttendant"]
    
    pilot_idx = 0
    fa_idx = 0
    
    for flight in sorted_flights:
        # Assign 2 pilots
        for _ in range(2):
            if pilot_idx < len(pilots):
                pilot = pilots[pilot_idx % len(pilots)]
                pairings.append({
                    "pairingId": f"P{pairing_id:04d}",
                    "crewId": pilot["crewId"],
                    "flights": [flight["flightNumber"]],
                    "dutyStart": f"2026-01-24T{flight['scheduledDeparture']}",
                    "dutyEnd": f"2026-01-24T{flight['scheduledArrival']}",
                    "totalFlightTime": flight["duration"],
                    "totalDutyTime": flight["duration"] + 60,
                    "returnsToBase": random.random() < 0.7,
                })
                pairing_id += 1
                pilot_idx += 1
        
        # Assign 3 FAs
        for _ in range(3):
            if fa_idx < len(fas):
                fa = fas[fa_idx % len(fas)]
                pairings.append({
                    "pairingId": f"P{pairing_id:04d}",
                    "crewId": fa["crewId"],
                    "flights": [flight["flightNumber"]],
                    "dutyStart": f"2026-01-24T{flight['scheduledDeparture']}",
                    "dutyEnd": f"2026-01-24T{flight['scheduledArrival']}",
                    "totalFlightTime": flight["duration"],
                    "totalDutyTime": flight["duration"] + 60,
                    "returnsToBase": random.random() < 0.7,
                })
                pairing_id += 1
                fa_idx += 1
    
    return pairings


def generate_disruptions(flights: List[Dict], num_disruptions: int) -> Dict:
    """Generate disruption scenario."""
    # Select flights to disrupt
    disrupted_flights = random.sample(flights, min(num_disruptions, len(flights)))
    
    disruptions = []
    affected_crew = []
    
    for flight in disrupted_flights:
        is_cancellation = random.random() < 0.12
        cause = random.choices(DISRUPTION_CAUSES, weights=DISRUPTION_CAUSE_WEIGHTS)[0]
        delay_minutes = random.randint(30, 300) if not is_cancellation else None
        
        disruptions.append({
            "flightNumber": flight["flightNumber"],
            "type": "cancellation" if is_cancellation else "delay",
            "cause": cause,
            "originalDeparture": f"2026-01-24T{flight['scheduledDeparture']}",
            "delayMinutes": delay_minutes,
            "isCascade": random.random() < 0.25,
        })
        
        # Generate affected crew
        num_affected = random.randint(1, 4)
        for j in range(num_affected):
            affected_crew.append({
                "crewId": f"PLT{random.randint(1, 500):03d}" if random.random() < 0.4 else f"FA{random.randint(1, 800):03d}",
                "originalPairing": [flight["flightNumber"]],
                "impact": random.choice(["delayed", "stranded", "timeout"]),
                "currentLocation": flight["origin"],
                "availableFrom": f"2026-01-24T{flight['scheduledDeparture']}",
            })
    
    return {
        "disruptions": disruptions,
        "affectedCrew": affected_crew,
        "metadata": {
            "scenario": "Major Multi-Hub Weather Event",
            "generated": datetime.now().isoformat(),
            "totalDisruptions": len(disruptions),
            "totalAffectedCrew": len(affected_crew),
            "cancellations": sum(1 for d in disruptions if d["type"] == "cancellation"),
            "delays": sum(1 for d in disruptions if d["type"] == "delay"),
        }
    }


def main():
    print("=" * 60)
    print("GENERATING LARGE-SCALE DATASET")
    print("=" * 60)
    print()
    
    data_dir = Path(__file__).parent.parent.parent / "data" / "output"
    
    # Generate data
    print(f"Generating {NUM_FLIGHTS} flights...")
    flights = generate_flights(NUM_FLIGHTS)
    
    print(f"Generating {NUM_CREW} crew members...")
    crew = generate_crew(NUM_CREW)
    
    print(f"Generating pairings...")
    pairings = generate_pairings(flights, crew)
    
    print(f"Generating {NUM_DISRUPTIONS} disruptions...")
    disruption_data = generate_disruptions(flights, NUM_DISRUPTIONS)
    
    # Save to files with "_large" suffix
    print()
    print("Saving to files...")
    
    with open(data_dir / "flights_large.json", "w") as f:
        json.dump(flights, f, indent=2)
    print(f"  - flights_large.json ({len(flights)} flights)")
    
    with open(data_dir / "crew_large.json", "w") as f:
        json.dump({"crew": crew}, f, indent=2)
    print(f"  - crew_large.json ({len(crew)} crew)")
    
    with open(data_dir / "pairings_large.json", "w") as f:
        json.dump({"pairings": pairings}, f, indent=2)
    print(f"  - pairings_large.json ({len(pairings)} pairings)")
    
    with open(data_dir / "disruptions_large.json", "w") as f:
        json.dump(disruption_data, f, indent=2)
    print(f"  - disruptions_large.json ({len(disruption_data['disruptions'])} disruptions)")
    
    print()
    print("=" * 60)
    print("GENERATION COMPLETE")
    print("=" * 60)
    print(f"Total flights: {len(flights)}")
    print(f"Total crew: {len(crew)}")
    print(f"Total pairings: {len(pairings)}")
    print(f"Total disruptions: {disruption_data['metadata']['totalDisruptions']}")
    print(f"Total affected crew: {disruption_data['metadata']['totalAffectedCrew']}")


if __name__ == "__main__":
    main()
