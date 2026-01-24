/**
 * Disruption Generator
 * 
 * PURPOSE:
 * Creates a realistic list of delays and cancellations that the HPC algorithm must resolve.
 * The original flights.json remains clean - disruptions are a separate input.
 * 
 * DISRUPTION PHILOSOPHY:
 * - Most days have some disruptions (weather, mechanical, crew issues)
 * - Delays cascade through aircraft (late inbound = late outbound)
 * - Crew can become "timed out" if delays push them over FAA limits
 * - The HPC must reassign crew to minimize stranded flights
 * 
 * REALISTIC DISTRIBUTIONS:
 * US domestic flight statistics (approximate):
 * - On-time (within 15 min): ~77%
 * - Minor delay (15-45 min): ~15%
 * - Major delay (1-3 hrs): ~5%
 * - Severe delay (3+ hrs): ~1%
 * - Cancellation: ~2%
 * 
 * DELAY CAUSES:
 * - Weather: 30% (often affects multiple flights at same airport)
 * - Mechanical: 25% (affects specific aircraft)
 * - Crew: 20% (late inbound crew, crew calling off)
 * - ATC: 15% (air traffic control delays)
 * - Late Aircraft: 10% (cascading from prior delay - generated automatically)
 */

import fs from 'fs';
import path from 'path';
import { createSeededRandom, randomChoice, randomInt, randomNormal } from './utils/random';

// Types
interface EnrichedFlight {
  flightNumber: string;
  origin: string;
  destination: string;
  aircraft: string;
  aircraftId: string;
  legIndex: number;
  scheduledDeparture: string;
  scheduledArrival: string;
  duration: number;
  distance: number;
  typical_passenger_count: number;
}

interface Aircraft {
  aircraftId: string;
  model: string;
  homeBase: string;
  rotation: string[];
}

interface Pairing {
  pairingId: string;
  crewId: string;
  flights: string[];
  dutyStart: string;
  dutyEnd: string;
  totalFlightTime: number;
  totalDutyTime: number;
  returnsToBase: boolean;
}

interface FlightCrewAssignment {
  pilots: string[];
  flightAttendants: string[];
}

interface Disruption {
  flightNumber: string;
  type: 'delay' | 'cancellation';
  delayMinutes?: number;
  cause: 'weather' | 'mechanical' | 'crew' | 'atc' | 'late_aircraft';
  originalDeparture: string;
  newDeparture?: string;
  isCascade: boolean;
  cascadeSource?: string;
}

interface AffectedCrew {
  crewId: string;
  originalPairing: string[];
  impact: 'delayed' | 'stranded' | 'timeout';
  currentLocation: string;
  availableFrom: string;
}

interface DisruptionsOutput {
  simulationTime: string;
  seed: number;
  disruptions: Disruption[];
  affectedCrew: AffectedCrew[];
  metadata: {
    totalDisruptions: number;
    delays: number;
    cancellations: number;
    cascadingDelays: number;
    crewAffected: number;
    generatedAt: string;
  };
}

// Constants
const TURNAROUND_TIME_MINUTES = 45;
const MAX_DUTY_TIME_MINUTES = 14 * 60;

// Primary disruption causes with probabilities
const DISRUPTION_CAUSES: { cause: Disruption['cause']; weight: number }[] = [
  { cause: 'weather', weight: 30 },
  { cause: 'mechanical', weight: 25 },
  { cause: 'crew', weight: 20 },
  { cause: 'atc', weight: 15 }
  // Note: 'late_aircraft' is generated via cascade, not primary
];

/**
 * Convert time string (HH:MM:SS) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

/**
 * Convert minutes since midnight to time string
 */
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60) % 24;
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00`;
}

/**
 * Pick a weighted random cause
 */
function pickCause(random: () => number): Disruption['cause'] {
  const totalWeight = DISRUPTION_CAUSES.reduce((sum, c) => sum + c.weight, 0);
  let r = random() * totalWeight;

  for (const { cause, weight } of DISRUPTION_CAUSES) {
    r -= weight;
    if (r <= 0) return cause;
  }

  return 'weather';
}

/**
 * Generate delay duration based on cause
 * Different causes have different typical delay distributions
 */
function generateDelayMinutes(cause: Disruption['cause'], random: () => number): number {
  switch (cause) {
    case 'weather':
      // Weather delays tend to be longer and more variable
      // Mean: 60 min, StdDev: 45 min (clamped to 15-240)
      return Math.max(15, Math.min(240, Math.round(randomNormal(60, 45, random))));

    case 'mechanical':
      // Mechanical can be quick (minor) or very long (major)
      // Bimodal, but we'll approximate with mean 90, stdDev 60
      return Math.max(15, Math.min(300, Math.round(randomNormal(90, 60, random))));

    case 'crew':
      // Crew delays typically waiting for inbound crew
      // Usually 30-60 minutes
      return randomInt(20, 90, random);

    case 'atc':
      // ATC delays are usually shorter but unpredictable
      return randomInt(15, 60, random);

    case 'late_aircraft':
      // This is passed in from cascade calculation
      return 0; // Will be set by cascade logic

    default:
      return 30;
  }
}

/**
 * Generate primary disruptions (before cascading)
 */
function generatePrimaryDisruptions(
  flights: EnrichedFlight[],
  random: () => number
): Map<string, Disruption> {
  const disruptions = new Map<string, Disruption>();

  for (const flight of flights) {
    const roll = random();

    // ~23% of flights have some disruption
    // - 2% cancellation
    // - 21% delay
    if (roll < 0.02) {
      // Cancellation
      disruptions.set(flight.flightNumber, {
        flightNumber: flight.flightNumber,
        type: 'cancellation',
        cause: pickCause(random),
        originalDeparture: flight.scheduledDeparture,
        isCascade: false
      });
    } else if (roll < 0.23) {
      // Delay
      const cause = pickCause(random);
      const delayMinutes = generateDelayMinutes(cause, random);
      const originalMinutes = timeToMinutes(flight.scheduledDeparture);
      const newDepartureMinutes = originalMinutes + delayMinutes;

      disruptions.set(flight.flightNumber, {
        flightNumber: flight.flightNumber,
        type: 'delay',
        delayMinutes,
        cause,
        originalDeparture: flight.scheduledDeparture,
        newDeparture: minutesToTime(newDepartureMinutes),
        isCascade: false
      });
    }
  }

  return disruptions;
}

/**
 * Propagate delays through aircraft rotations
 * If a flight is delayed, subsequent flights on the same aircraft may also be delayed
 */
function propagateCascades(
  disruptions: Map<string, Disruption>,
  flights: EnrichedFlight[],
  aircraft: Aircraft[]
): void {
  // Build flight lookup
  const flightMap = new Map(flights.map(f => [f.flightNumber, f]));

  // Process each aircraft's rotation
  for (const ac of aircraft) {
    let cumulativeDelay = 0;
    let cascadeSource: string | null = null;

    for (const flightNum of ac.rotation) {
      const flight = flightMap.get(flightNum);
      if (!flight) continue;

      const existingDisruption = disruptions.get(flightNum);

      // If this flight is canceled, subsequent flights lose the aircraft
      if (existingDisruption?.type === 'cancellation') {
        // Aircraft becomes unavailable - subsequent flights in rotation are affected
        // For simplicity, we'll treat this as needing a new aircraft (not modeled here)
        // Reset cascade tracking
        cumulativeDelay = 0;
        cascadeSource = null;
        continue;
      }

      // If this flight has a primary delay, it becomes the cascade source
      if (existingDisruption?.type === 'delay') {
        const originalArrival = timeToMinutes(flight.scheduledArrival);
        const delayedArrival = originalArrival + existingDisruption.delayMinutes!;

        // For next flight: compare delayed arrival + turnaround to scheduled departure
        cumulativeDelay = existingDisruption.delayMinutes!;
        cascadeSource = flightNum;
        continue;
      }

      // If there's a cumulative delay from a previous flight, check if it cascades
      if (cumulativeDelay > 0 && cascadeSource) {
        // Find the previous flight in rotation to get its delayed arrival
        const rotationIndex = ac.rotation.indexOf(flightNum);
        if (rotationIndex > 0) {
          const prevFlightNum = ac.rotation[rotationIndex - 1];
          const prevFlight = flightMap.get(prevFlightNum);

          if (prevFlight) {
            const prevDisruption = disruptions.get(prevFlightNum);

            // Calculate when aircraft is available
            let prevArrivalMinutes = timeToMinutes(prevFlight.scheduledArrival);
            if (prevDisruption?.type === 'delay') {
              prevArrivalMinutes += prevDisruption.delayMinutes!;
            }

            const aircraftAvailable = prevArrivalMinutes + TURNAROUND_TIME_MINUTES;
            const scheduledDeparture = timeToMinutes(flight.scheduledDeparture);

            // If aircraft arrives too late for scheduled departure
            if (aircraftAvailable > scheduledDeparture) {
              const cascadeDelay = aircraftAvailable - scheduledDeparture;

              // Only add if not already disrupted
              if (!disruptions.has(flightNum)) {
                disruptions.set(flightNum, {
                  flightNumber: flightNum,
                  type: 'delay',
                  delayMinutes: cascadeDelay,
                  cause: 'late_aircraft',
                  originalDeparture: flight.scheduledDeparture,
                  newDeparture: minutesToTime(scheduledDeparture + cascadeDelay),
                  isCascade: true,
                  cascadeSource
                });
              }

              // Update cumulative delay for next iteration
              cumulativeDelay = cascadeDelay;
            } else {
              // Aircraft had enough buffer, delay absorbed
              cumulativeDelay = 0;
              cascadeSource = null;
            }
          }
        }
      }
    }
  }
}

/**
 * Determine which crew members are affected by disruptions
 */
function findAffectedCrew(
  disruptions: Map<string, Disruption>,
  pairings: Pairing[],
  flightAssignments: Record<string, FlightCrewAssignment>,
  flights: EnrichedFlight[]
): AffectedCrew[] {
  const affected: AffectedCrew[] = [];
  const flightMap = new Map(flights.map(f => [f.flightNumber, f]));

  for (const pairing of pairings) {
    let isAffected = false;
    let impact: AffectedCrew['impact'] = 'delayed';
    let totalDelayMinutes = 0;
    let currentLocation = '';
    let lastArrivalMinutes = 0;

    for (const flightNum of pairing.flights) {
      const disruption = disruptions.get(flightNum);
      const flight = flightMap.get(flightNum);

      if (!flight) continue;

      if (disruption) {
        isAffected = true;

        if (disruption.type === 'cancellation') {
          // Crew is stranded at their current location
          impact = 'stranded';
          break;
        } else if (disruption.type === 'delay') {
          totalDelayMinutes += disruption.delayMinutes!;
        }
      }

      // Track location
      currentLocation = flight.destination;
      lastArrivalMinutes = timeToMinutes(flight.scheduledArrival) + (disruptions.get(flightNum)?.delayMinutes || 0);
    }

    if (isAffected) {
      // Check if delay causes timeout
      const dutyStartMinutes = timeToMinutes(pairing.dutyStart);
      const projectedDutyEnd = lastArrivalMinutes + 30; // 30 min release
      const totalDutyTime = projectedDutyEnd - dutyStartMinutes;

      if (totalDutyTime > MAX_DUTY_TIME_MINUTES) {
        impact = 'timeout';
      }

      affected.push({
        crewId: pairing.crewId,
        originalPairing: pairing.flights,
        impact,
        currentLocation: currentLocation || pairing.flights[0] ?
          flightMap.get(pairing.flights[0])?.origin || 'UNK' : 'UNK',
        availableFrom: minutesToTime(lastArrivalMinutes + 30)
      });
    }
  }

  return affected;
}

/**
 * Generate all disruptions
 */
export function generateDisruptions(
  flights: EnrichedFlight[],
  aircraft: { aircraft: Aircraft[] },
  pairings: { pairings: Pairing[]; flightCrewAssignments: Record<string, FlightCrewAssignment> },
  seed: number = 42
): DisruptionsOutput {
  const random = createSeededRandom(seed);

  // Generate primary disruptions
  console.log('   Generating primary disruptions...');
  const disruptions = generatePrimaryDisruptions(flights, random);
  const primaryCount = disruptions.size;
  console.log(`   Generated ${primaryCount} primary disruptions`);

  // Propagate cascades
  console.log('   Propagating cascading delays...');
  propagateCascades(disruptions, flights, aircraft.aircraft);
  const cascadeCount = disruptions.size - primaryCount;
  console.log(`   Generated ${cascadeCount} cascading delays`);

  // Find affected crew
  console.log('   Identifying affected crew...');
  const affectedCrew = findAffectedCrew(
    disruptions,
    pairings.pairings,
    pairings.flightCrewAssignments,
    flights
  );

  // Convert to array and sort by flight number
  const disruptionsArray = Array.from(disruptions.values())
    .sort((a, b) => a.flightNumber.localeCompare(b.flightNumber));

  // Calculate stats
  const delays = disruptionsArray.filter(d => d.type === 'delay').length;
  const cancellations = disruptionsArray.filter(d => d.type === 'cancellation').length;
  const cascades = disruptionsArray.filter(d => d.isCascade).length;

  return {
    simulationTime: '2026-01-24T05:00:00',
    seed,
    disruptions: disruptionsArray,
    affectedCrew,
    metadata: {
      totalDisruptions: disruptionsArray.length,
      delays,
      cancellations,
      cascadingDelays: cascades,
      crewAffected: affectedCrew.length,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Main execution
 */
export function runDisruptionGeneration(seed: number = 42): DisruptionsOutput {
  console.log('⚠️  Disruption Generator');
  console.log('========================\n');

  // Load required files
  const flightsPath = path.join(__dirname, 'output', 'flights_enriched.json');
  const aircraftPath = path.join(__dirname, 'output', 'aircraft.json');
  const pairingsPath = path.join(__dirname, 'output', 'crew_pairings.json');

  for (const p of [flightsPath, aircraftPath, pairingsPath]) {
    if (!fs.existsSync(p)) {
      throw new Error(`Required file not found: ${p}`);
    }
  }

  const flights = JSON.parse(fs.readFileSync(flightsPath, 'utf-8'));
  const aircraft = JSON.parse(fs.readFileSync(aircraftPath, 'utf-8'));
  const pairings = JSON.parse(fs.readFileSync(pairingsPath, 'utf-8'));

  console.log(`📂 Loaded ${flights.length} flights, ${aircraft.aircraft.length} aircraft, ${pairings.pairings.length} pairings`);

  // Generate
  const output = generateDisruptions(flights, aircraft, pairings, seed);

  // Save
  const outputPath = path.join(__dirname, 'output', 'disruptions.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`✅ Saved disruptions to disruptions.json`);

  // Print summary
  console.log('\n📊 Summary:');
  console.log(`   Total disruptions: ${output.metadata.totalDisruptions}`);
  console.log(`   - Delays: ${output.metadata.delays}`);
  console.log(`   - Cancellations: ${output.metadata.cancellations}`);
  console.log(`   - Cascading: ${output.metadata.cascadingDelays}`);
  console.log(`   Crew affected: ${output.metadata.crewAffected}`);

  // Print impact breakdown
  const impacts = output.affectedCrew.reduce((acc, c) => {
    acc[c.impact] = (acc[c.impact] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  console.log('\n   Crew Impact:');
  for (const [impact, count] of Object.entries(impacts)) {
    console.log(`   - ${impact}: ${count}`);
  }

  return output;
}

// Run if executed directly
if (require.main === module) {
  const seedArg = process.argv.find(arg => arg.startsWith('--seed='));
  const seed = seedArg ? parseInt(seedArg.split('=')[1]) : 42;
  runDisruptionGeneration(seed);
}
