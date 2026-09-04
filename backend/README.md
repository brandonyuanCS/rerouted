# Rerouted backend

The backend is a FastAPI service that loads deterministic airline-operation
fixtures, exposes them to the manager dashboard, and runs parallel tabu-search
jobs for crew recovery.

## Run locally

From the repository root:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r backend/requirements.txt
cd backend
uvicorn main:app --reload --port 8000
```

Configuration is read from `backend/.env`. Copy `.env.example` to `.env` and
set `USE_CLOUD_COMPUTE=true` only when a compatible Lambda function has been
deployed.

## Optimization lifecycle

1. `POST /api/jobs` creates an in-memory job.
2. A FastAPI background task loads the cached scenario.
3. Local mode starts independent searches with `ProcessPoolExecutor`; Lambda
   mode invokes the configured function synchronously.
4. Each local worker uses a distinct seed and tabu tenure.
5. The lowest-scoring solution is selected.
6. Reassignments are produced by diffing that solution against the original
   pairings, and coverage metrics are computed from the same assignment set.

Lower objective scores are better. The objective currently combines uncovered
flight penalties, disruption severity, assignment churn, overtime, and a small
home-base preference. Hard assignment checks cover certification, status, rest,
duty time, flight time, consecutive duty days, location, and required role mix.

## Tests

```powershell
python -m unittest discover -s tests -v
```

The regression suite checks resource-count consistency, the disruption-to-flight
join that supplies map routes, role-aware coverage, and solution-derived result
metrics.

## Operational limitations

- Jobs are process-local and are not durable.
- Progress is updated when individual search workers complete.
- The scenario and regulatory model are simplified.
- CORS is permissive for local development and must be restricted before any
  public deployment.
- The default simulation clock is fixed to the generated scenario date.
