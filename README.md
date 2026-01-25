# Rerouted

**Rerouted** is a parallel tabu search-based optimization engine for rapid airline crew recovery during operational disruptions (flight delays, cancellations, etc). It leverages realistic mock flight data from the Flight Engine API and provides a robust modeling of airline operations, FAA-compliant rules, and end-to-end real-time tools for schedulers, crew, and operations managers.

## Inspiration

In large-scale disruptions, reassigning airline crew is a major bottleneck. Crew schedulers must comply with complex FAA duty rules, location/certification constraints, and need to minimize cascading cancellations. Today, this process is manual and slow, often taking hours, worsening the passenger/operator impact.

**Rerouted** automates this process with parallel optimization, fast simulation, and a modern end-user UI for both web and mobile.

---

## Overview

- **Parallel Tabu Search:** Multiple scenarios explored in parallel for fast, high-quality crew reassignments.
- **Real-time updates:** Leveraging WebSockets for scheduler/crew/ops dashboards.
- **FAA-compliance engine:** 14-hour max duties, 10-hour rest, aircraft certifications, and more.
- **Rich mock data:** Real AA flight data, synthetic crew/rotation/pairing info, realistic disruption modeling.
- **Cross-platform:** Next.js web/React Native mobile apps.

---

## Tech Stack

**Frontend:**
- Next.js 14 (App Router, SSR)
- React, React Native (Expo)
- Tailwind CSS, Shadcn for UI
- Expo Notifications
- React Navigation

**Backend:**
- Node.js + Express for API server
- PostgreSQL for flight/crew/assignment data
- Redis for caching & real-time crew availability
- WebSockets (Socket.io)
- American Airlines Flight Engine API integration

---

## Key Features

- Parallel Tabu Search optimization for crew reassignment
- CPU-efficient simulations of large hub-and-spoke airline networks
- Full modeling of real airline constraints (duty, connections, rest, certifications, pairing logic)
- Handles real-world disruptions – delays, cascading effects, cancellations
- Mobile & web dashboard with real-time crew status/notifications

---

## Data Model

### Aircraft

| Column      | Type     |
| ----------- | -------- |
| aircraftId  | string   |
| model       | string   |
| homeBase    | string   |
| rotation    | string[] |

---

### Crew

| Column              | Type             |
| ------------------- | ---------------- |
| crewId              | string           |
| role                | enum             |
| name                | string           |
| homeBase            | string           |
| certifications      | string[]         |
| seniorityScore      | int              |
| status              | enum             |
| currentDutyStart    | datetime\| null  |
| flightTimeToday     | int              |
| dutyTimeToday       | int              |
| consecutiveDutyDays | int              |
| lastRestEnd         | datetime         |
| currentLocation     | string           |

---

### Crew Pairings

| Column          | Type     |
| --------------- | -------- |
| pairingId       | string   |
| crewId          | string   |
| flights         | string[] |
| dutyStart       | time     |
| dutyEnd         | time     |
| totalFlightTime | int      |
| totalDutyTime   | int      |
| returnsToBase   | boolean  |

---

### Flights

| Column                  | Type    |
| ----------------------- | ------- |
| flightNumber            | string  |
| origin                  | string  |
| destination             | string  |
| aircraft                | string  |
| scheduledDeparture      | time    |
| scheduledArrival        | time    |
| duration                | int     |
| distance                | int     |
| typical_passenger_count | int     |
| aircraftId              | string  |
| legIndex                | int     |

---

### Disruptions

| Column            | Type            |
| ----------------- | --------------- |
| flightNumber      | string          |
| type              | enum            |
| delayMinutes      | int \| null     |
| cause             | enum            |
| originalDeparture | time            |
| newDeparture      | time \| null    |
| isCascade         | boolean         |
| cascadeSource     | string \| null  |

---

### Affected Crew

| Column          | Type   |
| --------------- | ------ |
| crewId          | string |
| originalPairing | string |
| currentLocation | string |
| state           | enum   |

---

### Summary

| Column                | Type             |
| --------------------- | ---------------- |
| totalFlights          | int              |
| uniqueRoutes          | int              |
| airportsServed        | int              |
| aircraftTypes         | string[]         |
| totalAircraft         | int              |
| totalCrew             | int              |
| pilots                | int              |
| flightAttendants      | int              |
| crewByBase            | map<string, int> |
| totalPairings         | int              |
| avgLegsPerPairing     | float            |
| crewReturningToBase   | int              |
| unassignedFlights     | int              |
| totalDisruptions      | int              |
| delays                | int              |
| cancellations         | int              |
| cascadingDelays       | int              |
| crewAffected          | int              |
| seed                  | int              |
| generatedAt           | datetime         |

---

### Violations

| Column         | Type |
| -------------- | ---- |
| violations     | list |
| MCT            | int  |
| DUTY_OVERLIMIT | int  |
| TYPE_RATING    | int  |
| REST           | int  |
| TOTAL          | int  |

---

## API Usage / Flight Engine

This repo provides a mock flight scheduling API for development/testing. Deploy it on Render, Heroku, or locally.

See endpoints:
- `/airports?code=<IATA-CODE>`
- `/airports/all`
- `/flights?date=YYYY-MM-DD`
- `/flights?date=YYYY-MM-DD&origin=<IATA>`
- `/flights?date=YYYY-MM-DD&destination=<IATA>`
- `/flights?date=YYYY-MM-DD&flightNumber=<num>`
  
Responses are JSON-formatted, see examples in [original Flight Engine README](./README.md).

---

## Challenges

- Adhering to full FAA regulations and practical airline SOPs
- Efficient parallelization of crew recovery
- UI/UX complexities for real-time ops
- Simulating realistic disruptions and cascading effects

---

## Accomplishments & Takeaways

_TODO: Add accomplishments, takeaways, and demo outcomes here._

---

## What’s Next

- More robust mobile features for on-duty crew
- Improved disruption prediction/simulation
- Airline-scale Gantt visualizations
- Open data export and reporting

---

## Testing

Run tests with:
```
npm run test
```
Additional scripts:  
- `test` — all tests  
- `test:changed` — only tests for changed files

---

## Contributing

Interested in contributing? See [CONTRIBUTING.md](.github/CONTRIBUTING.md).

---
