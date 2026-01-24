/**
 * FAA Violation Validator
 * 
 * PURPOSE:
 * Scans all generated output files and detects FAA regulation violations.
 * This helps identify issues that need to be fixed in the generators.
 * 
 * VIOLATIONS CHECKED:
 * 1. MCT (Minimum Connection Time) - Must have 45 min between arrival and next departure
 * 2. Duty Over-limit - Max 14 hours from check-in to release
 * 3. Type Rating Gap - Pilot must be certified for aircraft type
 * 4. Rest Violation - Must have 10 hours rest before starting new duty
 */

import fs from 'fs';
import path from 'path';

// Constants
const MIN_CONNECTION_TIME = 45;     // Minutes
const MAX_DUTY_TIME = 14 * 60;      // 14 hours in minutes
const MIN_REST_TIME = 10 * 60;      // 10 hours in minutes
const REPORT_TIME = 60;             // 1 hour before departure
const RELEASE_TIME = 30;            // 30 min after arrival

// Types
interface Flight {
  flightNumber: string;
  origin: string;
  destination: string;
  aircraft: string;
  aircraftId: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  duration: number;
}

interface CrewMember {
  crewId: string;
  role: string;
  homeBase: string;
  certifications: string[];
  status: string;
  lastRestEnd: string;
  currentLocation: string;
}

interface Pairing {
  pairingId: string;
  crewId: string;
  flights: string[];
  dutyStart: string;
  dutyEnd: string;
  totalDutyTime: number;
}

interface FlightAssignment {
  pilots: string[];
  flightAttendants: string[];
}

interface Violation {
  type: 'MCT' | 'DUTY_OVERLIMIT' | 'TYPE_RATING' | 'REST';
  severity: 'ERROR' | 'WARNING';
  crewId: string;
  flightNumber?: string;
  details: string;
}

/**
 * Convert time string (HH:MM:SS) to minutes since midnight
 */
function timeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

/**
 * Load all required data files
 */
function loadData(outputDir: string) {
  const flights: Flight[] = JSON.parse(
    fs.readFileSync(path.join(outputDir, 'flights_enriched.json'), 'utf-8')
  );

  const crewData = JSON.parse(
    fs.readFileSync(path.join(outputDir, 'crew.json'), 'utf-8')
  );

  const pairingsData = JSON.parse(
    fs.readFileSync(path.join(outputDir, 'crew_pairings.json'), 'utf-8')
  );

  return {
    flights,
    crew: crewData.crew as CrewMember[],
    pairings: pairingsData.pairings as Pairing[],
    flightAssignments: pairingsData.flightCrewAssignments as Record<string, FlightAssignment>
  };
}

/**
 * Check MCT violations - minimum 45 minutes between connections
 */
function checkMCTViolations(
  pairings: Pairing[],
  flights: Flight[]
): Violation[] {
  const violations: Violation[] = [];
  const flightMap = new Map(flights.map(f => [f.flightNumber, f]));

  for (const pairing of pairings) {
    if (pairing.flights.length < 2) continue;

    for (let i = 0; i < pairing.flights.length - 1; i++) {
      const prevFlight = flightMap.get(pairing.flights[i]);
      const nextFlight = flightMap.get(pairing.flights[i + 1]);

      if (!prevFlight || !nextFlight) continue;

      const arrivalMinutes = timeToMinutes(prevFlight.scheduledArrival);
      const departureMinutes = timeToMinutes(nextFlight.scheduledDeparture);
      const connectionTime = departureMinutes - arrivalMinutes;

      if (connectionTime < MIN_CONNECTION_TIME) {
        violations.push({
          type: 'MCT',
          severity: 'ERROR',
          crewId: pairing.crewId,
          flightNumber: `${pairing.flights[i]} → ${pairing.flights[i + 1]}`,
          details: `Connection time ${connectionTime} min < ${MIN_CONNECTION_TIME} min MCT. ` +
            `Arrives ${prevFlight.scheduledArrival} at ${prevFlight.destination}, ` +
            `departs ${nextFlight.scheduledDeparture} from ${nextFlight.origin}`
        });
      }

      // Also check that the airports match (crew can't teleport)
      if (prevFlight.destination !== nextFlight.origin) {
        violations.push({
          type: 'MCT',
          severity: 'ERROR',
          crewId: pairing.crewId,
          flightNumber: `${pairing.flights[i]} → ${pairing.flights[i + 1]}`,
          details: `Airport mismatch! Arrives at ${prevFlight.destination} but next flight departs from ${nextFlight.origin}`
        });
      }
    }
  }

  return violations;
}

/**
 * Check duty time violations - max 14 hours
 */
function checkDutyViolations(pairings: Pairing[]): Violation[] {
  const violations: Violation[] = [];

  for (const pairing of pairings) {
    if (pairing.totalDutyTime > MAX_DUTY_TIME) {
      violations.push({
        type: 'DUTY_OVERLIMIT',
        severity: 'ERROR',
        crewId: pairing.crewId,
        details: `Duty time ${pairing.totalDutyTime} min (${(pairing.totalDutyTime / 60).toFixed(1)} hrs) ` +
          `exceeds ${MAX_DUTY_TIME / 60} hour limit. Flights: ${pairing.flights.join(' → ')}`
      });
    }
  }

  return violations;
}

/**
 * Check type rating violations - pilots must be certified for aircraft
 */
function checkTypeRatingViolations(
  flightAssignments: Record<string, FlightAssignment>,
  flights: Flight[],
  crew: CrewMember[]
): Violation[] {
  const violations: Violation[] = [];
  const flightMap = new Map(flights.map(f => [f.flightNumber, f]));
  const crewMap = new Map(crew.map(c => [c.crewId, c]));

  for (const [flightNumber, assignment] of Object.entries(flightAssignments)) {
    const flight = flightMap.get(flightNumber);
    if (!flight) continue;

    // Check pilots (FAs don't need type ratings)
    for (const pilotId of assignment.pilots) {
      const pilot = crewMap.get(pilotId);
      if (!pilot) continue;

      if (!pilot.certifications.includes(flight.aircraft)) {
        violations.push({
          type: 'TYPE_RATING',
          severity: 'ERROR',
          crewId: pilotId,
          flightNumber,
          details: `Pilot certified for [${pilot.certifications.join(', ')}] but assigned to ${flight.aircraft} aircraft`
        });
      }
    }
  }

  return violations;
}

/**
 * Check rest violations - crew must have 10 hours rest before duty
 */
function checkRestViolations(
  pairings: Pairing[],
  crew: CrewMember[]
): Violation[] {
  const violations: Violation[] = [];
  const crewMap = new Map(crew.map(c => [c.crewId, c]));

  for (const pairing of pairings) {
    const crewMember = crewMap.get(pairing.crewId);
    if (!crewMember) continue;

    // Parse rest end time and duty start time
    // lastRestEnd format: "2026-01-24T05:00:00"
    // dutyStart format: "05:00:00"
    const restEndTime = crewMember.lastRestEnd.split('T')[1];
    const restEndMinutes = timeToMinutes(restEndTime);
    const dutyStartMinutes = timeToMinutes(pairing.dutyStart);

    // Check if this is the same day (simplified - assume same day)
    // If duty starts before rest ends, that's a violation
    if (dutyStartMinutes < restEndMinutes) {
      // Duty starts before rest ends - violation!
      violations.push({
        type: 'REST',
        severity: 'ERROR',
        crewId: pairing.crewId,
        details: `Duty starts at ${pairing.dutyStart} but rest doesn't end until ${restEndTime}. ` +
          `Crew status was: ${crewMember.status}`
      });
    }

    // Calculate actual rest time (from prev day release to current check-in)
    // For day-of simulation, check if crew had proper rest
    // If lastRestEnd is at 07:00 and duty starts at 08:00, only 1 hour of "buffer" - 
    // but REST actually requires 10 hours BEFORE the rest end time
    // This is a bit circular - need to think about this more carefully
  }

  return violations;
}

/**
 * Main validation function
 */
export function validateData(outputDir: string): {
  violations: Violation[];
  summary: Record<string, number>;
} {
  console.log('🔍 FAA Violation Validator');
  console.log('==========================\n');

  const { flights, crew, pairings, flightAssignments } = loadData(outputDir);
  console.log(`📂 Loaded: ${flights.length} flights, ${crew.length} crew, ${pairings.length} pairings\n`);

  const allViolations: Violation[] = [];

  // Check MCT
  console.log('Checking MCT violations...');
  const mctViolations = checkMCTViolations(pairings, flights);
  allViolations.push(...mctViolations);
  console.log(`   Found ${mctViolations.length} MCT violations`);

  // Check Duty limits
  console.log('Checking duty time violations...');
  const dutyViolations = checkDutyViolations(pairings);
  allViolations.push(...dutyViolations);
  console.log(`   Found ${dutyViolations.length} duty violations`);

  // Check Type Ratings
  console.log('Checking type rating violations...');
  const typeViolations = checkTypeRatingViolations(flightAssignments, flights, crew);
  allViolations.push(...typeViolations);
  console.log(`   Found ${typeViolations.length} type rating violations`);

  // Check Rest
  console.log('Checking rest violations...');
  const restViolations = checkRestViolations(pairings, crew);
  allViolations.push(...restViolations);
  console.log(`   Found ${restViolations.length} rest violations`);

  // Summary
  const summary = {
    MCT: mctViolations.length,
    DUTY_OVERLIMIT: dutyViolations.length,
    TYPE_RATING: typeViolations.length,
    REST: restViolations.length,
    TOTAL: allViolations.length
  };

  console.log('\n📊 Summary:');
  console.log(`   MCT Violations:        ${summary.MCT}`);
  console.log(`   Duty Violations:       ${summary.DUTY_OVERLIMIT}`);
  console.log(`   Type Rating Violations: ${summary.TYPE_RATING}`);
  console.log(`   Rest Violations:       ${summary.REST}`);
  console.log(`   ─────────────────────────`);
  console.log(`   TOTAL:                 ${summary.TOTAL}`);

  // Print first few of each type
  if (allViolations.length > 0) {
    console.log('\n⚠️  Sample Violations:');

    const types = ['MCT', 'DUTY_OVERLIMIT', 'TYPE_RATING', 'REST'] as const;
    for (const type of types) {
      const typeViolations = allViolations.filter(v => v.type === type);
      if (typeViolations.length > 0) {
        console.log(`\n   ${type}:`);
        typeViolations.slice(0, 3).forEach(v => {
          console.log(`   - ${v.crewId}: ${v.details}`);
        });
        if (typeViolations.length > 3) {
          console.log(`   ... and ${typeViolations.length - 3} more`);
        }
      }
    }
  }

  return { violations: allViolations, summary };
}

// Run if executed directly
if (require.main === module) {
  const outputDir = path.join(__dirname, 'output');
  const { violations, summary } = validateData(outputDir);

  // Save violations to file for analysis
  const violationsPath = path.join(outputDir, 'violations.json');
  fs.writeFileSync(violationsPath, JSON.stringify({ violations, summary }, null, 2));
  console.log(`\n📁 Saved violations to violations.json`);

  // Exit with error code if violations found
  if (summary.TOTAL > 0) {
    process.exit(1);
  }
}
