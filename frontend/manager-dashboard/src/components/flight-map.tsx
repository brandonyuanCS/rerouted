'use client';

import dynamic from 'next/dynamic';

import type { FlightMapProps } from './flight-map-client';

export { AIRPORTS } from './flight-map-data';
export type { FlightRoute } from './flight-map-data';

/**
 * Leaflet reads browser globals while its modules are being evaluated. Loading
 * the complete map implementation dynamically keeps those modules out of the
 * server-rendered dependency graph.
 */
export const FlightMap = dynamic<FlightMapProps>(
  () => import('./flight-map-client').then((module) => module.FlightMapClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[500px] items-center justify-center rounded-2xl bg-slate-900/50">
        <div className="animate-pulse text-white/60">Loading map...</div>
      </div>
    ),
  },
);
