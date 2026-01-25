'use client';

import dynamic from 'next/dynamic';
import { MapContainer, TileLayer, CircleMarker, Polyline, Tooltip, Popup } from 'react-leaflet';

// Airport coordinates for US hubs
export const AIRPORTS: Record<string, { lat: number; lng: number; name: string }> = {
  DFW: { lat: 32.8998, lng: -97.0403, name: "Dallas/Fort Worth" },
  ORD: { lat: 41.9742, lng: -87.9073, name: "Chicago O'Hare" },
  LAX: { lat: 33.9416, lng: -118.4085, name: "Los Angeles" },
  JFK: { lat: 40.6413, lng: -73.7781, name: "New York JFK" },
  MIA: { lat: 25.7959, lng: -80.2870, name: "Miami" },
  ATL: { lat: 33.6407, lng: -84.4277, name: "Atlanta" },
  DEN: { lat: 39.8561, lng: -104.6737, name: "Denver" },
  PHX: { lat: 33.4373, lng: -112.0078, name: "Phoenix" },
  SEA: { lat: 47.4502, lng: -122.3088, name: "Seattle" },
  CLT: { lat: 35.2140, lng: -80.9431, name: "Charlotte" },
  BOS: { lat: 42.3656, lng: -71.0096, name: "Boston" },
  PHL: { lat: 39.8729, lng: -75.2437, name: "Philadelphia" },
};

export interface FlightRoute {
  origin: string;
  destination: string;
  flightNumber: string;
  status: 'normal' | 'disrupted' | 'recovered';
}

interface FlightMapInnerProps {
  routes: FlightRoute[];
  height: string;
}

// Generate curved path between two points
const getCurvedPath = (start: [number, number], end: [number, number]): [number, number][] => {
  const points: [number, number][] = [];
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;

  const distance = Math.sqrt(Math.pow(end[0] - start[0], 2) + Math.pow(end[1] - start[1], 2));
  const curveOffset = distance * 0.15;

  const angle = Math.atan2(end[0] - start[0], end[1] - start[1]);
  const controlLat = midLat + Math.cos(angle + Math.PI / 2) * curveOffset;
  const controlLng = midLng + Math.sin(angle + Math.PI / 2) * curveOffset;

  for (let t = 0; t <= 1; t += 0.05) {
    const lat = (1 - t) * (1 - t) * start[0] + 2 * (1 - t) * t * controlLat + t * t * end[0];
    const lng = (1 - t) * (1 - t) * start[1] + 2 * (1 - t) * t * controlLng + t * t * end[1];
    points.push([lat, lng]);
  }

  return points;
};

const getRouteColor = (status: FlightRoute['status']) => {
  switch (status) {
    case 'disrupted': return '#ef4444';
    case 'recovered': return '#22c55e';
    default: return '#0078D2';
  }
};

const getRouteOpacity = (status: FlightRoute['status']) => {
  switch (status) {
    case 'disrupted': return 0.9;
    case 'recovered': return 0.85;
    default: return 0.4;
  }
};

function FlightMapInner({ routes, height }: FlightMapInnerProps) {
  return (
    <MapContainer
      center={[39.5, -98.35]}
      zoom={4}
      style={{ height, width: '100%' }}
      zoomControl={false}
      attributionControl={false}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {routes.map((route, idx) => {
        const origin = AIRPORTS[route.origin];
        const dest = AIRPORTS[route.destination];
        if (!origin || !dest) return null;

        const path = getCurvedPath(
          [origin.lat, origin.lng],
          [dest.lat, dest.lng]
        );

        return (
          <Polyline
            key={`route-${idx}`}
            positions={path}
            pathOptions={{
              color: getRouteColor(route.status),
              weight: route.status === 'normal' ? 1.5 : 2.5,
              opacity: getRouteOpacity(route.status),
              dashArray: route.status === 'disrupted' ? '8, 4' : undefined,
            }}
          >
            <Popup>
              <div className="text-sm">
                <div className="font-bold">{route.flightNumber}</div>
                <div>{route.origin} → {route.destination}</div>
                <div className="capitalize text-xs mt-1">{route.status}</div>
              </div>
            </Popup>
          </Polyline>
        );
      })}

      {Object.entries(AIRPORTS).map(([code, airport]) => (
        <CircleMarker
          key={code}
          center={[airport.lat, airport.lng]}
          radius={8}
          pathOptions={{
            fillColor: '#0078D2',
            fillOpacity: 0.9,
            color: '#ffffff',
            weight: 2,
          }}
        >
          <Tooltip permanent direction="top" offset={[0, -10]} className="airport-label">
            <span className="font-bold text-xs">{code}</span>
          </Tooltip>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}

// Export with dynamic import to prevent SSR
export const FlightMap = dynamic(
  () => Promise.resolve(({ routes = [], className = '', height = '500px' }: {
    routes?: FlightRoute[];
    className?: string;
    height?: string
  }) => (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{ height }}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/30 pointer-events-none z-10" />
      <FlightMapInner routes={routes} height={height} />
      <style jsx global>{`
        .airport-label {
          background: rgba(0, 120, 210, 0.9) !important;
          border: 1px solid rgba(255, 255, 255, 0.3) !important;
          border-radius: 4px !important;
          color: white !important;
          font-weight: 600 !important;
          padding: 2px 6px !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3) !important;
        }
        .leaflet-popup-content-wrapper {
          background: rgba(30, 41, 59, 0.95) !important;
          color: white !important;
          border-radius: 8px !important;
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
        }
        .leaflet-popup-tip {
          background: rgba(30, 41, 59, 0.95) !important;
        }
      `}</style>
    </div>
  )),
  {
    ssr: false,
    loading: () => (
      <div className="bg-slate-900/50 rounded-2xl flex items-center justify-center h-[500px]">
        <div className="text-white/60 animate-pulse">Loading map...</div>
      </div>
    ),
  }
);
