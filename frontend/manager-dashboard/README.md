# Rerouted manager dashboard

This Next.js application is the inspection and control surface for the Rerouted
crew-recovery API. It visualizes disruption routes, starts optimization jobs,
tracks real worker progress, and exposes the complete flight, crew, pairing, and
disruption datasets through searchable paginated tables.

## Run

Start the backend on port 8000, then:

```powershell
npm ci
npm run dev
```

Open `http://localhost:3000`. To use a different API deployment:

```powershell
$env:NEXT_PUBLIC_API_URL='https://example.com/api'
npm run dev
```

The UI deliberately shows an actionable retry state when the API is unavailable;
it does not replace missing live data with demo fixtures.

## Quality checks

```powershell
npm run lint
npm run typecheck
npm run build
```

Leaflet is isolated in a browser-only dynamic module so every application route
can still be prerendered during a production build.
