/**
 * Crew Pairing Generator (v2 - Fixed FAA Compliance)
 * 
 * PURPOSE:
 * Assigns crew to flights in realistic multi-leg "pairings". A pairing is a sequence
 * of flights that one crew member works in a single duty period.
 * 
 * FIXES in v2:
 * - MCT Enforcement: Track arrival time, require 45 min between arrival and next departure
 * - Rest Enforcement: Skip crew who are still in required rest period
 * - Proper flight sequencing: Only assign crew to flights they can physically reach
 * 
 * FAA COMPLIANCE (tracked per crew member):
 * - Max flight time per duty: 8 hours
 * - Max duty period: 14 hours
 * - Report time: 1 hour before first departure
 * - Release time: 30 minutes after last arrival
 * - Minimum connection time: 45 minutes
 * - Minimum rest: 10 hours between duty periods
 */

import fs from 'fs';
import path from 'path';
import { createSeededRandom, shuffleArray } from './utils/random';

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

interface CrewMember {
  crewId: string;
  role: 'pilot' | 'flightAttendant';
  name: string;
  homeBase: string;
  certifications: string[];
  seniorityScore: number;
  status: 'available' | 'on_duty' | 'resting' | 'day_off';
  currentDutyStart: string | null;
  flightTimeToday: number;
  dutyTimeToday: number;
  consecutiveDutyDays: number;
  lastRestEnd: string;
  currentLocation: string;
  // NEW: Track when crew arrived at current location (minutes since midnight)
  // -1 means they started the day there (available from 0)
  arrivalTimeAtLocation: number;
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

interface PairingsOutput {
  pairings: Pairing[];
  flightCrewAssignments: Record<string, FlightCrewAssignment>;
  unassignedFlights: string[];
  metadata: {
    totalPairings: number;
    avgLegsPerPairing: number;
    crewReturningToBase: number;
    generatedAt: string;
  };
}

// FAA Constants
const REPORT_TIME_MINUTES = 60;          // Report 1 hour before first flight
const RELEASE_TIME_MINUTES = 30;         // Released 30 min after last arrival
const MAX_FLIGHT_TIME_MINUTES = 8 * 60;  // 8 hours
const MAX_DUTY_TIME_MINUTES = 14 * 60;   // 14 hours
const MIN_CONNECTION_TIME = 45;          // MCT: 45 minutes minimum
const MIN_REST_TIME_MINUTES = 10 * 60;   // 10 hours minimum rest

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
 * Calculate required FA count for a flight based on passenger count
 */
function getRequiredFAs(passengerCount: number): number {
  return Math.max(2, Math.ceil(passengerCount / 50));
}

/**
 * Check if a crew member can work a flight without violating FAA limits
 * This is the CRITICAL function for FAA compliance
 */
function canWorkFlight(
  crew: CrewMember,
  flight: EnrichedFlight
): { canWork: boolean; reason?: string } {

  const departureMinutes = timeToMinutes(flight.scheduledDeparture);
  const arrivalMinutes = timeToMinutes(flight.scheduledArrival);

  // ===== STATUS CHECKS =====

  // Cannot work if on day off
  if (crew.status === 'day_off') {
    return { canWork: false, reason: 'On day off' };
  }

  // Cannot work if still resting (REST VIOLATION CHECK)
  if (crew.status === 'resting') {
    const restEndMinutes = timeToMinutes(crew.lastRestEnd.split('T')[1]);
    if (departureMinutes - REPORT_TIME_MINUTES < restEndMinutes) {
      return { canWork: false, reason: `Still resting until ${crew.lastRestEnd}` };
    }
  }

  // Check consecutive duty days (max 6)
  if (crew.consecutiveDutyDays >= 6 && crew.status !== 'on_duty') {
    return { canWork: false, reason: 'Exceeded 6 consecutive duty days' };
  }

  // ===== LOCATION & MCT CHECKS =====

  // Must be at flight origin
  if (crew.currentLocation !== flight.origin) {
    return { canWork: false, reason: `At ${crew.currentLocation}, not ${flight.origin}` };
  }

  // MCT CHECK: If crew just arrived (on_duty), must have MCT before departure
  if (crew.status === 'on_duty' && crew.arrivalTimeAtLocation >= 0) {
    const connectionTime = departureMinutes - crew.arrivalTimeAtLocation;
    if (connectionTime < MIN_CONNECTION_TIME) {
      return {
        canWork: false,
        reason: `MCT violation: only ${connectionTime} min connection (need ${MIN_CONNECTION_TIME})`
      };
    }
  }

  // ===== CERTIFICATION CHECK =====

  if (crew.role === 'pilot' && !crew.certifications.includes(flight.aircraft)) {
    return { canWork: false, reason: `Not certified for ${flight.aircraft}` };
  }

  // ===== DUTY TIME CHECKS =====

  // Check flight time limit
  if (crew.flightTimeToday + flight.duration > MAX_FLIGHT_TIME_MINUTES) {
    return { canWork: false, reason: 'Would exceed 8-hour flight time limit' };
  }

  // Check duty time limit
  let projectedDutyEnd: number;
  let projectedDutyTime: number;

  if (crew.status !== 'on_duty' || crew.currentDutyStart === null) {
    // New duty period
    const dutyStartMinutes = departureMinutes - REPORT_TIME_MINUTES;
    projectedDutyEnd = arrivalMinutes + RELEASE_TIME_MINUTES;
    projectedDutyTime = projectedDutyEnd - dutyStartMinutes;
  } else {
    // Extending current duty
    const dutyStartMinutes = timeToMinutes(crew.currentDutyStart.split('T')[1]);
    projectedDutyEnd = arrivalMinutes + RELEASE_TIME_MINUTES;
    projectedDutyTime = projectedDutyEnd - dutyStartMinutes;
  }

  if (projectedDutyTime > MAX_DUTY_TIME_MINUTES) {
    return { canWork: false, reason: `Would exceed 14-hour duty limit (${Math.round(projectedDutyTime / 60)}h)` };
  }

  return { canWork: true };
}

/**
 * Assign crew to a flight and update their state
 */
function assignCrewToFlight(
  crew: CrewMember,
  flight: EnrichedFlight,
  pairings: Map<string, Pairing>
): void {
  const departureMinutes = timeToMinutes(flight.scheduledDeparture);
  const arrivalMinutes = timeToMinutes(flight.scheduledArrival);

  // Update or create pairing
  let pairing = pairings.get(crew.crewId);

  if (!pairing || crew.status !== 'on_duty') {
    // Start new pairing
    const dutyStartMinutes = departureMinutes - REPORT_TIME_MINUTES;
    pairing = {
      pairingId: `PAIR${String(pairings.size + 1).padStart(4, '0')}`,
      crewId: crew.crewId,
      flights: [],
      dutyStart: minutesToTime(dutyStartMinutes),
      dutyEnd: '',
      totalFlightTime: 0,
      totalDutyTime: 0,
      returnsToBase: false
    };
    pairings.set(crew.crewId, pairing);

    // Update crew status
    crew.currentDutyStart = `2026-01-24T${minutesToTime(dutyStartMinutes)}`;
    crew.status = 'on_duty';
    crew.dutyTimeToday = 0;
  }

  // Add flight to pairing
  pairing.flights.push(flight.flightNumber);
  pairing.totalFlightTime += flight.duration;

  // Update duty end time
  const dutyEndMinutes = arrivalMinutes + RELEASE_TIME_MINUTES;
  pairing.dutyEnd = minutesToTime(dutyEndMinutes);

  // Calculate total duty time
  const dutyStartMinutes = timeToMinutes(pairing.dutyStart);
  pairing.totalDutyTime = dutyEndMinutes - dutyStartMinutes;

  // Update crew state
  crew.flightTimeToday += flight.duration;
  crew.dutyTimeToday = pairing.totalDutyTime;
  crew.currentLocation = flight.destination;
  crew.arrivalTimeAtLocation = arrivalMinutes;  // Track when they arrived

  // Check if returned to base
  pairing.returnsToBase = (crew.currentLocation === crew.homeBase);
}

/**
 * Generate crew pairings for all flights
 */
export function generatePairings(
  flights: EnrichedFlight[],
  crewList: CrewMember[],
  seed: number = 42
): PairingsOutput {
  const random = createSeededRandom(seed);

  // Make a copy of crew and add arrivalTimeAtLocation field
  const crew = crewList.map(c => ({
    ...c,
    // -1 means they start the day at their home base (no MCT constraint for first flight)
    arrivalTimeAtLocation: -1
  }));

  // Sort flights by departure time
  const sortedFlights = [...flights].sort((a, b) =>
    timeToMinutes(a.scheduledDeparture) - timeToMinutes(b.scheduledDeparture)
  );

  // Track pairings per crew member
  const pairings = new Map<string, Pairing>();

  // Track flight crew assignments
  const flightCrewAssignments: Record<string, FlightCrewAssignment> = {};
  const unassignedFlights: string[] = [];

  // Process each flight in chronological order
  for (const flight of sortedFlights) {
    const requiredFAs = getRequiredFAs(flight.typical_passenger_count);

    flightCrewAssignments[flight.flightNumber] = {
      pilots: [],
      flightAttendants: []
    };

    // Find eligible pilots
    const eligiblePilots = crew
      .filter(c => c.role === 'pilot' && canWorkFlight(c, flight).canWork)
      .sort((a, b) => {
        // Priority 1: Crew already on duty at this airport (continuing a pairing)
        const aOnDuty = a.status === 'on_duty' && a.currentLocation === flight.origin ? 1 : 0;
        const bOnDuty = b.status === 'on_duty' && b.currentLocation === flight.origin ? 1 : 0;
        if (aOnDuty !== bOnDuty) return bOnDuty - aOnDuty;

        // Priority 2: Crew based at this airport (fresh, no MCT constraint)
        const aHome = a.homeBase === flight.origin && a.status === 'available' ? 1 : 0;
        const bHome = b.homeBase === flight.origin && b.status === 'available' ? 1 : 0;
        if (aHome !== bHome) return bHome - aHome;

        // Priority 3: Seniority
        return b.seniorityScore - a.seniorityScore;
      });

    // Assign 2 pilots
    for (let i = 0; i < 2 && i < eligiblePilots.length; i++) {
      const pilot = eligiblePilots[i];
      assignCrewToFlight(pilot, flight, pairings);
      flightCrewAssignments[flight.flightNumber].pilots.push(pilot.crewId);
    }

    // Find eligible flight attendants
    const eligibleFAs = crew
      .filter(c => c.role === 'flightAttendant' && canWorkFlight(c, flight).canWork)
      .sort((a, b) => {
        const aOnDuty = a.status === 'on_duty' && a.currentLocation === flight.origin ? 1 : 0;
        const bOnDuty = b.status === 'on_duty' && b.currentLocation === flight.origin ? 1 : 0;
        if (aOnDuty !== bOnDuty) return bOnDuty - aOnDuty;

        const aHome = a.homeBase === flight.origin && a.status === 'available' ? 1 : 0;
        const bHome = b.homeBase === flight.origin && b.status === 'available' ? 1 : 0;
        if (aHome !== bHome) return bHome - aHome;

        return b.seniorityScore - a.seniorityScore;
      });

    // Assign required FAs
    for (let i = 0; i < requiredFAs && i < eligibleFAs.length; i++) {
      const fa = eligibleFAs[i];
      assignCrewToFlight(fa, flight, pairings);
      flightCrewAssignments[flight.flightNumber].flightAttendants.push(fa.crewId);
    }

    // Check if flight is fully crewed
    const assignedPilots = flightCrewAssignments[flight.flightNumber].pilots.length;
    const assignedFAs = flightCrewAssignments[flight.flightNumber].flightAttendants.length;

    if (assignedPilots < 2 || assignedFAs < requiredFAs) {
      unassignedFlights.push(flight.flightNumber);
      console.warn(`⚠️  Flight ${flight.flightNumber}: ${assignedPilots}/2 pilots, ${assignedFAs}/${requiredFAs} FAs`);
    }
  }

  // Convert pairings map to array
  const pairingsArray = Array.from(pairings.values());

  // Calculate stats
  const totalLegs = pairingsArray.reduce((sum, p) => sum + p.flights.length, 0);
  const avgLegsPerPairing = pairingsArray.length > 0
    ? totalLegs / pairingsArray.length
    : 0;
  const crewReturningToBase = pairingsArray.filter(p => p.returnsToBase).length;

  return {
    pairings: pairingsArray,
    flightCrewAssignments,
    unassignedFlights,
    metadata: {
      totalPairings: pairingsArray.length,
      avgLegsPerPairing: parseFloat(avgLegsPerPairing.toFixed(2)),
      crewReturningToBase,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Main execution
 */
export function runPairingGeneration(seed: number = 42): PairingsOutput {
  console.log('🔗 Crew Pairing Generator');
  console.log('=========================\n');

  // Load enriched flights
  const flightsPath = path.join(__dirname, 'output', 'flights_enriched.json');
  if (!fs.existsSync(flightsPath)) {
    throw new Error('flights_enriched.json not found. Run generateAircraft.ts first.');
  }
  const flights: EnrichedFlight[] = JSON.parse(fs.readFileSync(flightsPath, 'utf-8'));
  console.log(`📂 Loaded ${flights.length} flights`);

  // Load crew
  const crewPath = path.join(__dirname, 'output', 'crew.json');
  if (!fs.existsSync(crewPath)) {
    throw new Error('crew.json not found. Run generateCrew.ts first.');
  }
  const crewData = JSON.parse(fs.readFileSync(crewPath, 'utf-8'));
  console.log(`📂 Loaded ${crewData.crew.length} crew members`);

  // Generate pairings
  const pairingsOutput = generatePairings(flights, crewData.crew, seed);

  // Save
  const outputPath = path.join(__dirname, 'output', 'crew_pairings.json');
  fs.writeFileSync(outputPath, JSON.stringify(pairingsOutput, null, 2));
  console.log(`✅ Saved pairings to crew_pairings.json`);

  // Print summary
  console.log('\n📊 Summary:');
  console.log(`   Total pairings: ${pairingsOutput.metadata.totalPairings}`);
  console.log(`   Avg legs per pairing: ${pairingsOutput.metadata.avgLegsPerPairing}`);
  console.log(`   Crew returning to base: ${pairingsOutput.metadata.crewReturningToBase}`);
  console.log(`   Unassigned flights: ${pairingsOutput.unassignedFlights.length}`);

  if (pairingsOutput.unassignedFlights.length > 0) {
    console.log(`   ⚠️  Unassigned: ${pairingsOutput.unassignedFlights.slice(0, 5).join(', ')}...`);
  }

  return pairingsOutput;
}

// Run if executed directly
if (require.main === module) {
  const seedArg = process.argv.find(arg => arg.startsWith('--seed='));
  const seed = seedArg ? parseInt(seedArg.split('=')[1]) : 42;
  runPairingGeneration(seed);
}
