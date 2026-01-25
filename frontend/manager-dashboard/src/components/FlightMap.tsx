'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Flight, Disruption } from '@/lib/types';
import { AIRPORT_COORDINATES } from '@/lib/airport-coords';
import L from 'leaflet';

// Fix for default marker icons missing
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png',
});

interface FlightMapProps {
  flights: Flight[];
  disruptions: Disruption[];
}

export default function FlightMap({ flights, disruptions }: FlightMapProps) {
  const airportCodes = Object.keys(AIRPORT_COORDINATES);
  const disruptedFlightNumbers = new Set(disruptions.map(d => d.flight_number));

  const createAirportIcon = (code: string) => L.divIcon({
    className: 'bg-transparent',
    html: `<div class="flex items-center justify-center w-8 h-8 bg-slate-900 text-white rounded-full text-xs font-bold border-2 border-white shadow-lg">${code}</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });

  return (
    <MapContainer
      center={[39.8283, -98.5795]}
      zoom={4}
      className="w-full h-[600px] rounded-lg shadow-xl"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      />

      {/* Airports */}
      {airportCodes.map(code => (
        <Marker
          key={code}
          position={AIRPORT_COORDINATES[code]}
          icon={createAirportIcon(code)}
        >
          <Popup>{code}</Popup>
        </Marker>
      ))}

      {/* Flight Paths */}
      {flights.map(flight => {
        const start = AIRPORT_COORDINATES[flight.origin];
        const end = AIRPORT_COORDINATES[flight.destination];

        if (!start || !end) return null;

        const isDisrupted = disruptedFlightNumbers.has(flight.flight_number);
        const color = isDisrupted ? '#ef4444' : '#22c55e'; // Red or Green
        const weight = isDisrupted ? 3 : 1;
        const opacity = isDisrupted ? 0.8 : 0.4;

        if (!isDisrupted && Math.random() > 0.1) return null; // Show only 10% of normal flights to reduce clutter

        return (
          <Polyline
            key={flight.flight_number}
            positions={[start, end]}
            pathOptions={{ color, weight, opacity }}
          >
            <Popup>
              <div className="text-sm font-bold">
                {flight.flight_number}
              </div>
              <div className="text-xs">
                {flight.origin} → {flight.destination}
                <br />
                {isDisrupted ? 'DISRUPTED' : 'On Time'}
              </div>
            </Popup>
          </Polyline>
        );
      })}
    </MapContainer>
  );
}
