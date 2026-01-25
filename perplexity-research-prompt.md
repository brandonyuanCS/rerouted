# Perplexity Deep Research Prompt

**Research Topic: Airline Crew Scheduling Optimization Algorithms and FAA Regulatory Compliance for Real-Time Disruption Recovery**

---

## Context

I am building a backend logic engine for an airline crew coordination system (targeting American Airlines operations) that must solve two interconnected NP-hard optimization problems:

1. **Crew Pairing Problem** - Dividing a flight schedule into compliant multi-day work packages where each pairing starts and ends at the crew's home base, covers specific flights, and adheres to all regulatory limits.

2. **Crew Recovery/Re-Rostering Problem** - When disruptions occur (delays, cancellations, crew unavailability), the system must re-optimize crew assignments in real-time while minimizing cascading effects across the network.

The system must operate within strict FAA regulations and handle the combinatorial complexity of reassigning hundreds of crew members across a disrupted flight network.

---

## Available Data Structure

Our system has the following data to work with:

### 1. Crew Data (~1,014 crew members)
```json
{
  "crewId": "PLT001",
  "role": "pilot" | "flight_attendant",
  "name": "string",
  "homeBase": "DFW" | "ORD" | "CLT" | "MIA" | "PHX" | "PHL" | "LAX" | "JFK",
  "certifications": ["738", "757", "321"],
  "seniorityScore": 2600,
  "status": "available" | "day_off" | "resting" | "on_duty",
  "currentDutyStart": "ISO timestamp" | null,
  "flightTimeToday": 0,
  "dutyTimeToday": 0,
  "consecutiveDutyDays": 6,
  "lastRestEnd": "ISO timestamp",
  "currentLocation": "airport code"
}
```

### 2. Flight Data (~276 flights, 25 airports, 147 unique routes)
```json
{
  "flightNumber": "AA1000",
  "origin": "DFW",
  "destination": "ORD",
  "aircraft": "738",
  "scheduledDeparture": "06:00:00",
  "scheduledArrival": "08:30:00",
  "duration": 150,
  "distance": 802,
  "aircraftId": "N738AA001",
  "legIndex": 1
}
```

### 3. Crew Pairings (~897 pairings)
```json
{
  "pairingId": "PAIR0001",
  "crewId": "PLT012",
  "flights": ["AA1000", "AA1029", "AA1006"],
  "dutyStart": "05:00:00",
  "dutyEnd": "17:20:00",
  "totalFlightTime": 470,
  "totalDutyTime": 740,
  "returnsToBase": false
}
```

### 4. Disruptions (~69 disruptions: 61 delays, 8 cancellations)
```json
{
  "flightNumber": "AA1005",
  "type": "delay" | "cancellation",
  "delayMinutes": 117,
  "cause": "weather" | "mechanical" | "crew" | "late_aircraft" | "atc",
  "originalDeparture": "10:00:00",
  "newDeparture": "11:57:00",
  "isCascade": true,
  "cascadeSource": "AA1044"
}
```

### 5. Aircraft Data (~214 aircraft across 3 types: 738, 757, 321)
```json
{
  "aircraftId": "N321AA001",
  "model": "321",
  "homeBase": "DFW",
  "rotation": ["AA1150"]
}
```

---

## Research Questions

### Part 1: Algorithms and Solution Approaches

1. **What are the most effective algorithms for solving the Crew Pairing Problem (CPP)?**
   - Column generation approaches
   - Set partitioning/covering formulations
   - Branch-and-price methods
   - Constraint programming approaches
   - Metaheuristics (genetic algorithms, simulated annealing, tabu search)
   - Which approaches are best for near-real-time solving?

2. **What algorithms are used for Crew Recovery/Re-rostering during disruptions?**
   - Incremental re-optimization vs. full re-solve
   - Rolling horizon approaches
   - Constraint-based local search
   - Auction-based and market-clearing mechanisms
   - Machine learning approaches for predicting disruption impacts
   - How do airlines handle cascading disruption effects?

3. **What open-source tools or libraries exist for airline crew scheduling?**
   - OR-Tools (Google)
   - OptaPlanner
   - CPLEX/Gurobi (if academic licenses available)
   - Custom implementations on GitHub
   - Any airline-specific open-source projects?

4. **What hybrid approaches combine optimization with heuristics for practical implementation?**
   - How to balance solution quality vs. computation time?
   - What decomposition strategies work for large-scale problems?
   - How to handle the multi-day pairing structure?

5. **What data structures and graph representations are most efficient?**
   - Time-space networks
   - Connection networks
   - Duty period graphs
   - How to model the "return to base" constraint efficiently?

---

### Part 2: FAA Regulations - Comprehensive Rule Set

Please provide a complete, organized reference of all FAA regulations that a crew scheduling logic engine must enforce. Organize by category:

#### Flight Time Limitations (14 CFR Part 117 for passengers, Part 121 for cargo)
- Maximum flight time per duty period
- Maximum flight time per calendar day
- Maximum flight time per 7 consecutive days
- Maximum flight time per calendar month
- Maximum flight time per calendar year
- How flight time is calculated (block time vs. flight time)

#### Duty Time Limitations
- Maximum duty period length based on:
  - Report time (start of duty)
  - Number of flight segments
  - Time zone crossings
  - Augmented vs. non-augmented crew
- Duty period extensions and their limits
- When duty time starts and ends

#### Rest Requirements
- Minimum rest period between duty periods
- Reduced rest provisions and compensatory rest
- Rest facility requirements for augmented operations
- Definition of "suitable accommodation"
- Rest requirements for reserve crew

#### Consecutive Duty Day Limits
- Maximum consecutive days of duty
- Required days off per week/month
- How "day off" is defined

#### Flight Attendant-Specific Rules (14 CFR 121.467)
- Duty period limits for flight attendants
- Rest requirements
- How FA rules differ from pilot rules

#### Special Circumstances
- Unforeseen operational circumstances extensions
- Emergency deviation authority
- Deadheading crew considerations
- International operations differences
- Red-eye/night flying limitations
- Fatigue risk management system (FRMS) provisions

#### Certification Requirements
- Currency requirements for specific aircraft types
- Recent experience requirements
- How to validate crew can legally operate a flight

---

### Part 3: Implementation Guidance

1. **How do commercial airline operations control centers (OCC) typically implement crew recovery?**
   - Decision support systems used
   - Human-in-the-loop vs. automated approaches
   - Time constraints for making re-assignment decisions

2. **What are industry best practices for crew notification and acceptance workflows?**
   - How much time do crew have to respond to reassignments?
   - Priority ordering (seniority, legality, positioning)

3. **What metrics should the system optimize for during disruption recovery?**
   - Minimize crew reassignments
   - Minimize passenger delays
   - Minimize deadhead/positioning flights
   - Minimize cost (overtime, hotels)
   - Weighted multi-objective approaches

4. **How to handle the "look-ahead" problem?**
   - When a disruption occurs, how far into the future should re-optimization consider?
   - How to prevent "fixing today's problem" from creating tomorrow's crisis?

---

## Desired Output Format

Please structure your research findings as:

1. **Algorithm Summary Table** - Name, complexity, pros/cons, best use case
2. **FAA Regulation Reference Sheet** - Rule, CFR citation, specific limits, edge cases
3. **Implementation Recommendations** - Prioritized list of approaches for a hackathon-scale prototype
4. **Open Source Resources** - Libraries, papers, GitHub repos with links
5. **Key Academic Papers** - Seminal works in airline crew scheduling (with citations)

---

## Additional Context

- This is for a hackathon project (TAMUhack 2026) sponsored by American Airlines
- The system should be able to demonstrate real-time crew reassignment when disruptions are injected
- We have ~1,000 crew members, ~276 flights, and ~70 disruptions to handle
- The backend needs to be fast enough for a demo (solutions within seconds, not hours)
- We are building this as a proof-of-concept, not production system
