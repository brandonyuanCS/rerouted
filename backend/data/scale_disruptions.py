"""
Scale up the disruption dataset for more visible HPC computation.
Creates a major weather event scenario with 200+ disruptions.
"""

import json
import random
from pathlib import Path
from datetime import datetime, timedelta

# Seed for reproducibility
random.seed(42)

# Load existing data
data_dir = Path(__file__).parent.parent.parent / "data" / "output"

with open(data_dir / "flights_enriched.json") as f:
    flights = json.load(f)

with open(data_dir / "crew.json") as f:
    crew_data = json.load(f)

with open(data_dir / "disruptions.json") as f:
    original_disruptions = json.load(f)

# Configuration for scaled scenario
NUM_DISRUPTIONS = 200  # Up from 69
WEATHER_HUBS = ["ORD", "DFW", "CLT", "JFK", "LAX"]  # Major weather impact
DELAY_RANGE = (30, 300)  # 30 min to 5 hour delays
CANCELLATION_RATE = 0.15  # 15% of disruptions are cancellations

CAUSES = ["weather", "mechanical", "crew", "atc", "late_aircraft"]
CAUSE_WEIGHTS = [0.4, 0.15, 0.15, 0.15, 0.15]  # Weather dominant

def generate_scaled_disruptions():
    """Generate a larger set of disruptions."""
    
    # Get flights that can be disrupted (originating from weather hubs)
    eligible_flights = [
        f for f in flights 
        if f["origin"] in WEATHER_HUBS
    ]
    
    # Sample flights for disruption
    disrupted_flights = random.sample(
        eligible_flights, 
        min(NUM_DISRUPTIONS, len(eligible_flights))
    )
    
    disruptions = []
    
    for flight in disrupted_flights:
        is_cancellation = random.random() < CANCELLATION_RATE
        cause = random.choices(CAUSES, weights=CAUSE_WEIGHTS)[0]
        delay_minutes = random.randint(*DELAY_RANGE) if not is_cancellation else None
        
        # Parse original departure
        dep_time = flight.get("scheduledDeparture", "08:00:00")
        
        disruption = {
            "flightNumber": flight["flightNumber"],
            "type": "cancellation" if is_cancellation else "delay",
            "cause": cause,
            "originalDeparture": f"2026-01-24T{dep_time}",
            "delayMinutes": delay_minutes,
            "isCascade": random.random() < 0.3,  # 30% are cascades
        }
        
        if delay_minutes:
            # Calculate new departure
            base = datetime.strptime(f"2026-01-24T{dep_time}", "%Y-%m-%dT%H:%M:%S")
            new_dep = base + timedelta(minutes=delay_minutes)
            disruption["newDeparture"] = new_dep.strftime("%Y-%m-%dT%H:%M:%S")
        
        disruptions.append(disruption)
    
    # Generate affected crew for each disruption
    affected_crew = []
    crew_list = crew_data["crew"]
    
    for d in disruptions:
        # Find crew at that location
        flight = next((f for f in flights if f["flightNumber"] == d["flightNumber"]), None)
        if not flight:
            continue
        
        origin = flight["origin"]
        local_crew = [c for c in crew_list if c.get("currentLocation") == origin]
        
        # Randomly affect 1-3 crew per disruption
        num_affected = random.randint(1, min(3, len(local_crew)))
        for crew in random.sample(local_crew, num_affected):
            affected_crew.append({
                "crewId": crew["crewId"],
                "originalPairing": [d["flightNumber"]],
                "impact": random.choice(["delayed", "stranded", "timeout"]),
                "currentLocation": origin,
                "availableFrom": d.get("newDeparture", d["originalDeparture"]),
            })
    
    return {
        "disruptions": disruptions,
        "affectedCrew": affected_crew,
        "metadata": {
            "scenario": "Major Winter Storm - Multi-Hub Impact",
            "generated": datetime.now().isoformat(),
            "totalDisruptions": len(disruptions),
            "totalAffectedCrew": len(affected_crew),
            "cancellations": sum(1 for d in disruptions if d["type"] == "cancellation"),
            "delays": sum(1 for d in disruptions if d["type"] == "delay"),
        }
    }


def main():
    print("Generating scaled disruption scenario...")
    
    scaled_data = generate_scaled_disruptions()
    
    # Save to new file
    output_path = data_dir / "disruptions_scaled.json"
    with open(output_path, "w") as f:
        json.dump(scaled_data, f, indent=2)
    
    print(f"Saved to {output_path}")
    print(f"Stats:")
    print(f"  - Total disruptions: {scaled_data['metadata']['totalDisruptions']}")
    print(f"  - Cancellations: {scaled_data['metadata']['cancellations']}")
    print(f"  - Delays: {scaled_data['metadata']['delays']}")
    print(f"  - Affected crew: {scaled_data['metadata']['totalAffectedCrew']}")


if __name__ == "__main__":
    main()
