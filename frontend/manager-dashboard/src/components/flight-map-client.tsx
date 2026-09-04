'use client';

import {
  CircleMarker,
  MapContainer,
  Polyline,
  Popup,
  TileLayer,
  Tooltip,
} from 'react-leaflet';

import { AIRPORTS, type FlightRoute } from './flight-map-data';

export interface FlightMapProps {
  routes?: FlightRoute[];
  className?: string;
  height?: string;
}

function getCurvedPath(
  start: [number, number],
  end: [number, number],
): [number, number][] {
  const points: [number, number][] = [];
  const midLat = (start[0] + end[0]) / 2;
  const midLng = (start[1] + end[1]) / 2;
  const distance = Math.hypot(end[0] - start[0], end[1] - start[1]);
  const curveOffset = distance * 0.15;
  const angle = Math.atan2(end[0] - start[0], end[1] - start[1]);
  const controlLat = midLat + Math.cos(angle + Math.PI / 2) * curveOffset;
  const controlLng = midLng + Math.sin(angle + Math.PI / 2) * curveOffset;

  for (let step = 0; step <= 20; step += 1) {
    const t = step / 20;
    const lat =
      (1 - t) ** 2 * start[0] +
      2 * (1 - t) * t * controlLat +
      t ** 2 * end[0];
    const lng =
      (1 - t) ** 2 * start[1] +
      2 * (1 - t) * t * controlLng +
      t ** 2 * end[1];
    points.push([lat, lng]);
  }

  return points;
}

function getRouteColor(status: FlightRoute['status']): string {
  switch (status) {
    case 'disrupted':
      return '#ef4444';
    case 'recovered':
      return '#22c55e';
    default:
      return '#0078D2';
  }
}

function getRouteOpacity(status: FlightRoute['status']): number {
  switch (status) {
    case 'disrupted':
      return 0.9;
    case 'recovered':
      return 0.85;
    default:
      return 0.4;
  }
}

export function FlightMapClient({
  routes = [],
  className = '',
  height = '500px',
}: FlightMapProps) {
  return (
    <div className={`relative overflow-hidden rounded-2xl ${className}`} style={{ height }}>
      <MapContainer
        center={[39.5, -98.35]}
        zoom={4}
        style={{ height, width: '100%' }}
        zoomControl={false}
        attributionControl={false}
      >
        <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager_nolabels/{z}/{x}/{y}{r}.png" />

        {routes.map((route, index) => {
          const origin = AIRPORTS[route.origin];
          const destination = AIRPORTS[route.destination];
          if (!origin || !destination) return null;

          const path = getCurvedPath(
            [origin.lat, origin.lng],
            [destination.lat, destination.lng],
          );

          return (
            <Polyline
              key={`${route.flightNumber}-${route.origin}-${route.destination}-${index}`}
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
                  <div className="mt-1 text-xs capitalize">{route.status}</div>
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
              <span className="text-xs font-bold">{code}</span>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>

      <style jsx global>{`
        .leaflet-container,
        .leaflet-pane {
          z-index: 0 !important;
        }
        .leaflet-top,
        .leaflet-bottom {
          z-index: 1 !important;
        }
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
          border: 1px solid rgba(255, 255, 255, 0.2) !important;
          border-radius: 8px !important;
        }
        .leaflet-popup-tip {
          background: rgba(30, 41, 59, 0.95) !important;
        }
      `}</style>
    </div>
  );
}
