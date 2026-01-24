/**
 * Aircraft Rotation Generator
 * 
 * PURPOSE:
 * Assigns unique aircraft tail numbers to flights and builds realistic daily rotations.
 * This is essential for delay propagation - when an aircraft arrives late, its next flight
 * is also delayed.
 * 
 * ALGORITHM:
 * 1. Group flights by aircraft type (738, 757, 321)
 * 2. Sort flights by departure time
 * 3. For each flight, find an available aircraft that:
 *    - Is the correct type
 *    - Is at the origin airport
 *    - Has had at least 45 min turnaround since last flight
 * 4. If no aircraft available, create a new one at that airport
 * 
 * OUTPUT:
 * - aircraft.json: Fleet roster with daily rotations
 * - flights_enriched.json: Original flights with aircraftId and legIndex added
 */

import fs from 'fs';
import path from 'path';
import { createSeededRandom } from './utils/random';

// Types
interface Flight {
  flightNumber: string;
  origin: string;
  destination: string;
  aircraft: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  duration: number;
  distance: number;
  typical_passenger_count: number;
}

interface EnrichedFlight extends Flight {
  aircraftId: string;
  legIndex: number;  // Which leg of the aircraft's day (1 = first flight)
}

interface Aircraft {
  aircraftId: string;
  model: string;
  homeBase: string;        // Where aircraft starts/ends day (overnight base)
  currentLocation: string; // Current airport (updated as we assign)
  availableAt: number;     // Minutes since midnight when aircraft is available
  rotation: string[];      // List of flight numbers in order
}

interface AircraftOutput {
  aircraft: Omit<Aircraft, 'currentLocation' | 'availableAt'>[];
  metadata: {
    totalAircraft: number;
    byType: Record<string, number>;
    generatedAt: string;
  };
}

// Constants
const TURNAROUND_TIME_MINUTES = 45;  // Minimum ground time between flights
const AA_HUBS = ["DFW", "ORD", "CLT", "MIA", "PHX", "PHL", "LAX", "JFK", "DCA"];

/**
 * Convert time string (HH:MM:SS) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Generate aircraft assignments for all flights
 */
export function generateAircraftRotations(
  flights: Flight[],
  seed: number = 42
): { aircraft: AircraftOutput; enrichedFlights: EnrichedFlight[] } {

  const random = createSeededRandom(seed);

  // Group flights by aircraft type
  const flightsByType: Record<string, Flight[]> = {};
  for (const flight of flights) {
    if (!flightsByType[flight.aircraft]) {
      flightsByType[flight.aircraft] = [];
    }
    flightsByType[flight.aircraft].push(flight);
  }

  // Sort each group by departure time
  for (const type in flightsByType) {
    flightsByType[type].sort((a, b) =>
      timeToMinutes(a.scheduledDeparture) - timeToMinutes(b.scheduledDeparture)
    );
  }

  // Aircraft pool - keyed by aircraft type
  const aircraftPool: Record<string, Aircraft[]> = {};

  // Track flight -> aircraft assignment
  const flightToAircraft: Map<string, { aircraftId: string; legIndex: number }> = new Map();

  // Process each aircraft type
  for (const type in flightsByType) {
    aircraftPool[type] = [];
    let aircraftCounter = 1;

    for (const flight of flightsByType[type]) {
      const departureMinutes = timeToMinutes(flight.scheduledDeparture);
      const arrivalMinutes = timeToMinutes(flight.scheduledArrival);

      // Find an available aircraft at the origin
      let assignedAircraft: Aircraft | null = null;

      for (const aircraft of aircraftPool[type]) {
        if (
          aircraft.currentLocation === flight.origin &&
          aircraft.availableAt + TURNAROUND_TIME_MINUTES <= departureMinutes
        ) {
          assignedAircraft = aircraft;
          break;
        }
      }

      // If no aircraft available, create a new one
      if (!assignedAircraft) {
        // Determine home base - prefer hubs, but use origin if not a hub
        const homeBase = AA_HUBS.includes(flight.origin)
          ? flight.origin
          : AA_HUBS[Math.floor(random() * AA_HUBS.length)];

        assignedAircraft = {
          aircraftId: `N${type}AA${String(aircraftCounter++).padStart(3, '0')}`,
          model: type,
          homeBase,
          currentLocation: flight.origin,
          availableAt: 0,  // Available from start of day
          rotation: []
        };
        aircraftPool[type].push(assignedAircraft);
      }

      // Assign flight to aircraft
      assignedAircraft.rotation.push(flight.flightNumber);
      assignedAircraft.currentLocation = flight.destination;
      assignedAircraft.availableAt = arrivalMinutes;

      flightToAircraft.set(flight.flightNumber, {
        aircraftId: assignedAircraft.aircraftId,
        legIndex: assignedAircraft.rotation.length
      });
    }
  }

  // Build enriched flights
  const enrichedFlights: EnrichedFlight[] = flights.map(flight => {
    const assignment = flightToAircraft.get(flight.flightNumber)!;
    return {
      ...flight,
      aircraftId: assignment.aircraftId,
      legIndex: assignment.legIndex
    };
  });

  // Build aircraft output (remove internal tracking fields)
  const allAircraft = Object.values(aircraftPool).flat();
  const aircraftOutput: AircraftOutput = {
    aircraft: allAircraft.map(a => ({
      aircraftId: a.aircraftId,
      model: a.model,
      homeBase: a.homeBase,
      rotation: a.rotation
    })),
    metadata: {
      totalAircraft: allAircraft.length,
      byType: Object.fromEntries(
        Object.entries(aircraftPool).map(([type, list]) => [type, list.length])
      ),
      generatedAt: new Date().toISOString()
    }
  };

  return { aircraft: aircraftOutput, enrichedFlights };
}

/**
 * Main execution - can be run standalone or imported
 */
export function runAircraftGeneration(seed: number = 42): void {
  console.log('✈️  Aircraft Rotation Generator');
  console.log('================================\n');

  // Load flights
  const flightsPath = path.join(__dirname, 'output', 'flights.json');
  const flights: Flight[] = JSON.parse(fs.readFileSync(flightsPath, 'utf-8'));
  console.log(`📂 Loaded ${flights.length} flights from flights.json`);

  // Generate
  const { aircraft, enrichedFlights } = generateAircraftRotations(flights, seed);

  // Save aircraft.json
  const aircraftPath = path.join(__dirname, 'output', 'aircraft.json');
  fs.writeFileSync(aircraftPath, JSON.stringify(aircraft, null, 2));
  console.log(`✅ Saved ${aircraft.metadata.totalAircraft} aircraft to aircraft.json`);

  // Save flights_enriched.json
  const enrichedPath = path.join(__dirname, 'output', 'flights_enriched.json');
  fs.writeFileSync(enrichedPath, JSON.stringify(enrichedFlights, null, 2));
  console.log(`✅ Saved enriched flights to flights_enriched.json`);

  // Print summary
  console.log('\n📊 Summary:');
  console.log(`   Total aircraft: ${aircraft.metadata.totalAircraft}`);
  for (const [type, count] of Object.entries(aircraft.metadata.byType)) {
    console.log(`   - ${type}: ${count} aircraft`);
  }

  // Calculate average legs per aircraft
  const totalLegs = aircraft.aircraft.reduce((sum, a) => sum + a.rotation.length, 0);
  const avgLegs = (totalLegs / aircraft.aircraft.length).toFixed(1);
  console.log(`   Avg legs per aircraft: ${avgLegs}`);
}

// Run if executed directly
if (require.main === module) {
  const seedArg = process.argv.find(arg => arg.startsWith('--seed='));
  const seed = seedArg ? parseInt(seedArg.split('=')[1]) : 42;
  runAircraftGeneration(seed);
}
