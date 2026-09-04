# Rerouted

Rerouted is a crew-recovery simulation for airline disruptions. It combines an
FAA constraint-aware, parallel tabu-search optimizer with an operations dashboard
and a mobile application for employees. 

Data used in this implementation is from the Flight Engine API.

## System overview

```text
Synthetic operations data (JSON)
              |
              v
       FastAPI service
       |             |
       v             v
Read APIs       Job manager
                     |
                     v
            ProcessPoolExecutor
                     |
                     v
          Independent tabu searches
                     |
                     v
        Best solution + assignment diff
              |
              v
       Next.js operations dashboard
```

The default large scenario contains 600 flights, 2,400 crew members, 2,400
pairings, and 350 disruptions. All records are synthetic and deterministic.

## Technical highlights

- Independent tabu searches run across a configurable local process pool.
- Workers use different random seeds and tabu tenures to diversify the search.
- Candidate assignments enforce aircraft certification, crew status, rest,
  duty-time, flight-time, consecutive-duty-day, location, and role-composition
  constraints.
- The API exposes real worker completion, iteration, score, and evaluated-move
  progress while a job is running.
- Result metrics are calculated by diffing the winning assignment set against
  the original pairings.
- The dashboard renders all production-sized resources with typed API clients,
  explicit failure states, filtering, and bounded pagination.
- An optional AWS Lambda execution path uses the same optimizer and result
  construction logic as local execution.

## Repository structure

```text
backend/
  api/          FastAPI routes and schemas
  cloud/        Optional Lambda client, handler, and deployment tooling
  data/         JSON loading and large-scenario generation
  jobs/         In-memory optimization job lifecycle
  optimizer/    Constraints, moves, scoring, tabu search, and result reporting
  parallel/     Local multi-process orchestration
  tests/        API and optimizer regression tests
data/
  output/       Deterministic simulation inputs
  generate*.ts  TypeScript data-generation pipeline
frontend/
  manager-dashboard/  Integrated Next.js operations UI
  crew-mobile/        Expo companion-app prototype
```

## Getting started

### Prerequisites

- Python 3.11 or newer
- Node.js 20 or newer

### 1. Start the API

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cd backend
uvicorn main:app --reload --port 8000
```

On macOS or Linux, activate the environment with
`source .venv/bin/activate` instead.

The API is available at `http://localhost:8000`; interactive OpenAPI
documentation is available at `http://localhost:8000/docs`.

### 2. Start the manager dashboard

```powershell
cd frontend/manager-dashboard
npm ci
npm run dev
```

Open `http://localhost:3000`. The frontend uses
`http://localhost:8000/api` by default. Override it with
`NEXT_PUBLIC_API_URL` when needed.

### 3. Run the mobile prototype

```powershell
cd frontend/crew-mobile
npm ci
npm start
```

The Expo application demonstrates the intended crew acceptance workflow. It
is currently a standalone prototype and is not connected to the FastAPI job
and assignment lifecycle.

## API surface

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/data/summary` | Scenario counts |
| `GET` | `/api/data/flights` | Flight schedule, coverage, and disruption state |
| `GET` | `/api/data/crew` | Crew availability and qualifications |
| `GET` | `/api/data/pairings` | Current duty pairings |
| `GET` | `/api/data/disruptions` | Network disruption records with flight routes |
| `POST` | `/api/jobs` | Start an optimization job |
| `GET` | `/api/jobs/{job_id}` | Poll progress and retrieve the result |
| `GET` | `/api/jobs` | List jobs held by the current API process |

Example job request:

```json
{
  "num_workers": 4,
  "timeout_seconds": 30,
  "priority": "balanced"
}
```

## Verification

Backend regression tests:

```powershell
cd backend
python -m unittest discover -s tests -v
```

Manager dashboard:

```powershell
cd frontend/manager-dashboard
npm run lint
npm run typecheck
npm run build
```

Mobile type check:

```powershell
cd frontend/crew-mobile
npx tsc --noEmit
```

Generated-data constraints:

```powershell
cd data
npm ci
npm run validate
```

The validator checks minimum connection time, maximum duty time, aircraft type
ratings, and rest-window consistency.

## Modeling scope and limitations

Rerouted is a simulation, not an airline dispatch or regulatory-compliance
system. Its rules intentionally simplify real collective bargaining agreements,
aircraft staffing, deadheading, time zones, schedule overlap, and the complete
FAA regulatory framework. Jobs and results are held in memory and are lost when
the API restarts. Authentication, durable storage, notifications, and the mobile
publishing workflow are outside the current implementation.

These boundaries are explicit so the repository can be evaluated on the system
that is implemented: deterministic data generation, constrained local search,
parallel orchestration, typed APIs, and an integrated inspection UI.
