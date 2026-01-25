# Backend - Crew Recovery Command Center

## What It Does
- Optimizes crew reassignments when flight disruptions occur
- Uses parallel Tabu Search across 8 workers to explore 10,000+ scenarios
- Returns top solution with metrics in 15-30 seconds

## Algorithm: Tabu Search
- Metaheuristic for NP-hard combinatorial optimization
- Avoids cycling by maintaining a "tabu list" of recent moves
- Aspiration criteria: override tabu if move produces best-ever solution
- Neighborhood moves: REASSIGN (add crew), SWAP (exchange crew)

## Parallelization Strategy
- Built-in `ProcessPoolExecutor` distributes work across CPU cores
- Ensures compatibility with Python 3.13 on Windows
- 8 independent search threads with varied tabu tenures (5, 7, 10, 12, 15)

## Constraint Enforcement (FAA Regulations)
- 14-hour max duty time
- 8-hour max flight time
- 10-hour minimum rest between duties
- 6 consecutive duty days maximum
- Aircraft type certification required
- Crew must be at departure airport

## Objective Function (Penalties)
- 10,000 points per uncovered flight (can't operate)
- 500 points for severe delays (>2 hrs)
- 200 points for major delays (1-2 hrs)
- 25 points per crew reassignment
- 0.5 points per minute overtime (soft 12-hr limit)

## API Endpoints
- POST /api/jobs - Submit optimization job
- GET /api/jobs/:id - Get job status and results
- GET /api/data/summary - Data stats
- GET /api/data/disruptions - List disruptions
- GET /api/data/flights - List flights

## Job Result Format
```json
{
  "reassignments": [
    {
      "type": "reassign",
      "flight": "AA1005",
      "crew_id": "PLT050",
      "crew_name": "William Wright",
      "crew_role": "pilot",
      "from_location": "DFW",
      "to_location": "CLT",
      "reason": "Delay on AA1005 (late_aircraft): 117min delay",
      "action": "Reassigned William Wright (PLT050) to AA1005"
    }
  ],
  "metrics": {
    "total_disrupted_flights": 61,
    "flights_recovered": 25,
    "crew_reassigned": 25,
    "original_delay_minutes": 4814,
    "projected_delay_saved": 1684,
    "cost_savings_usd": 662500
  }
}
```

## Data Scale
- 276 flights
- 1,014 crew members (405 pilots, 609 FAs)
- 897 existing pairings
- 69 disruptions (61 delays, 8 cancellations)
- 307 affected crew members

## Running
```bash
cd backend
pip install -r requirements.txt
python main.py
```

## Tech Stack
- Python 3.11+
- FastAPI for REST API
- ProcessPoolExecutor (built-in) for parallel processing
- Pydantic for data validation
