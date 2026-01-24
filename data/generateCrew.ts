/**
 * Crew Generator
 * 
 * PURPOSE:
 * Generates a realistic pool of pilots and flight attendants for American Airlines.
 * Each crew member has certifications, home base, seniority, and FAA duty time tracking fields.
 * 
 * FAA REGULATIONS (14 CFR Part 117 - simplified for simulation):
 * - Max flight duty period: 9-14 hours depending on start time and sectors
 * - Max flight time: 8-9 hours
 * - Min rest between duty periods: 10 hours
 * - Max consecutive duty days: 6 before required day off
 * 
 * CREW DISTRIBUTION STRATEGY (IMPROVED v2):
 * - Analyze flight departures by airport AND by aircraft type
 * - Ensure enough certified pilots at each airport for peak demand
 * - Generate significantly more crew than minimum to ensure coverage
 * 
 * KEY INSIGHT from testing:
 * The critical constraint is having enough 757-certified pilots at airports
 * with heavy 757 traffic (especially LAX). We need to over-provision.
 */

import fs from 'fs';
import path from 'path';
import { createSeededRandom, randomChoice, randomInt, shuffleArray } from './utils/random';

// Types
interface CrewMember {
  crewId: string;
  role: 'pilot' | 'flightAttendant';
  name: string;
  homeBase: string;
  certifications: string[];        // Aircraft types qualified for
  seniorityScore: number;          // Higher = more senior, used for tiebreaks
  status: 'available' | 'on_duty' | 'resting' | 'day_off';

  // FAA tracking fields (snapshot at simulation start: 05:00)
  currentDutyStart: string | null; // ISO timestamp when duty started
  flightTimeToday: number;         // Minutes of actual flying today
  dutyTimeToday: number;           // Minutes on duty today
  consecutiveDutyDays: number;     // Days worked in a row (0-6)
  lastRestEnd: string;             // ISO timestamp when last rest ended

  // Location tracking
  currentLocation: string;         // Airport code
}

interface CrewOutput {
  crew: CrewMember[];
  metadata: {
    totalPilots: number;
    totalFlightAttendants: number;
    byBase: Record<string, number>;
    generatedAt: string;
  };
}

// Aircraft types
const AIRCRAFT_TYPES = ['738', '757', '321'];

// First and last names for realistic crew generation
const FIRST_NAMES = [
  'James', 'John', 'Robert', 'Michael', 'David', 'William', 'Richard', 'Joseph',
  'Thomas', 'Christopher', 'Mary', 'Patricia', 'Jennifer', 'Linda', 'Elizabeth',
  'Barbara', 'Susan', 'Jessica', 'Sarah', 'Karen', 'Emily', 'Daniel', 'Matthew',
  'Anthony', 'Mark', 'Steven', 'Andrew', 'Joshua', 'Kenneth', 'Kevin', 'Brian',
  'Michelle', 'Amanda', 'Melissa', 'Stephanie', 'Nicole', 'Angela', 'Samantha'
];

const LAST_NAMES = [
  'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
  'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson',
  'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson',
  'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker',
  'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores'
];

/**
 * Analyze flights to compute crew requirements per airport
 * Returns detailed breakdown by airport and aircraft type
 */
interface AirportRequirements {
  totalFlights: number;
  byAircraftType: Record<string, number>;
  peakHourFlights: number;  // Max flights departing in any single hour
}

function analyzeFlightSchedule(flights: any[]): Map<string, AirportRequirements> {
  const requirements = new Map<string, AirportRequirements>();

  // Group flights by origin and hour
  const byOriginHour = new Map<string, Map<number, any[]>>();

  for (const flight of flights) {
    const origin = flight.origin;
    const hour = parseInt(flight.scheduledDeparture.split(':')[0]);

    if (!byOriginHour.has(origin)) {
      byOriginHour.set(origin, new Map());
    }
    const hourMap = byOriginHour.get(origin)!;
    if (!hourMap.has(hour)) {
      hourMap.set(hour, []);
    }
    hourMap.get(hour)!.push(flight);
  }

  // Calculate requirements for each airport
  for (const [origin, hourMap] of byOriginHour) {
    const allFlights = Array.from(hourMap.values()).flat();

    // Count by aircraft type
    const byType: Record<string, number> = {};
    for (const f of allFlights) {
      byType[f.aircraft] = (byType[f.aircraft] || 0) + 1;
    }

    // Find peak hour
    let peakHour = 0;
    for (const [_, flightsInHour] of hourMap) {
      peakHour = Math.max(peakHour, flightsInHour.length);
    }

    requirements.set(origin, {
      totalFlights: allFlights.length,
      byAircraftType: byType,
      peakHourFlights: peakHour
    });
  }

  return requirements;
}

/**
 * Generate pilot certifications
 * ALL pilots get 738 certification (most common aircraft)
 * 757 and 321 certs are based on airport needs
 */
function generatePilotCertifications(
  needs757: boolean,
  needs321: boolean,
  random: () => number
): string[] {
  const certs: string[] = ['738']; // Everyone gets 738

  // If this pilot is designated for 757 routes, always give 757 cert
  if (needs757) {
    certs.push('757');
  } else if (random() < 0.3) {
    // Some non-designated pilots also get 757 for flexibility
    certs.push('757');
  }

  // Similar for 321
  if (needs321) {
    certs.push('321');
  } else if (random() < 0.25) {
    certs.push('321');
  }

  return certs;
}

/**
 * Generate a single crew member
 */
function generateCrewMember(
  id: string,
  role: 'pilot' | 'flightAttendant',
  homeBase: string,
  needs757: boolean,
  needs321: boolean,
  random: () => number
): CrewMember {

  // Pilots need specific aircraft certifications
  // FAs can work any aircraft (their certification is passenger-based)
  const certifications = role === 'pilot'
    ? generatePilotCertifications(needs757, needs321, random)
    : AIRCRAFT_TYPES; // FAs work all types

  // Seniority: 1-5000, higher is more senior
  const seniorityScore = randomInt(1, 5000, random);

  // Status at simulation start (05:00 AM)
  // Make 90% available for best coverage
  const statusRoll = random();
  let status: CrewMember['status'];
  let consecutiveDutyDays: number;
  let lastRestEnd: string;

  if (statusRoll < 0.90) {
    // 90% available and ready to work
    status = 'available';
    consecutiveDutyDays = randomInt(0, 4, random);
    lastRestEnd = '2026-01-24T05:00:00';
  } else if (statusRoll < 0.95) {
    // 5% on day off
    status = 'day_off';
    consecutiveDutyDays = 6;
    lastRestEnd = '2026-01-23T20:00:00';
  } else {
    // 5% resting
    status = 'resting';
    consecutiveDutyDays = randomInt(1, 5, random);
    const restEndHour = randomInt(6, 7, random);
    lastRestEnd = `2026-01-24T${String(restEndHour).padStart(2, '0')}:00:00`;
  }

  return {
    crewId: id,
    role,
    name: `${randomChoice(FIRST_NAMES, random)} ${randomChoice(LAST_NAMES, random)}`,
    homeBase,
    certifications,
    seniorityScore,
    status,
    currentDutyStart: null,
    flightTimeToday: 0,
    dutyTimeToday: 0,
    consecutiveDutyDays,
    lastRestEnd,
    currentLocation: homeBase
  };
}

/**
 * Calculate required crew per airport based on peak demand
 * Uses a much more generous multiplier to ensure coverage
 */
function calculateCrewByAirport(
  requirements: Map<string, AirportRequirements>
): Map<string, { pilots: number; fas: number; needs757: number; needs321: number }> {

  const PILOTS_PER_FLIGHT = 2;
  const AVG_FAS_PER_FLIGHT = 3;

  // Use peak hour demand × 2.5 as baseline (need crew for multiple waves)
  // Plus a flat minimum to handle spoke airports
  const PEAK_MULTIPLIER = 2.5;
  const MIN_PILOTS_PER_AIRPORT = 10;
  const MIN_FAS_PER_AIRPORT = 15;

  const crewByAirport = new Map<string, { pilots: number; fas: number; needs757: number; needs321: number }>();

  for (const [airport, req] of requirements) {
    // Base on peak hour for crew that DON'T fly out
    const peakPilots = req.peakHourFlights * PILOTS_PER_FLIGHT * PEAK_MULTIPLIER;
    const peakFAs = req.peakHourFlights * AVG_FAS_PER_FLIGHT * PEAK_MULTIPLIER;

    // Number of 757/321 certified pilots needed (for peak coverage)
    const needs757 = (req.byAircraftType['757'] || 0) * PILOTS_PER_FLIGHT;
    const needs321 = (req.byAircraftType['321'] || 0) * PILOTS_PER_FLIGHT;

    crewByAirport.set(airport, {
      pilots: Math.max(MIN_PILOTS_PER_AIRPORT, Math.ceil(peakPilots)),
      fas: Math.max(MIN_FAS_PER_AIRPORT, Math.ceil(peakFAs)),
      needs757,
      needs321
    });
  }

  return crewByAirport;
}

/**
 * Generate all crew members based on airport requirements
 */
export function generateCrew(
  flights: any[],
  seed: number = 42
): CrewOutput {
  const random = createSeededRandom(seed);

  // Analyze airport requirements
  const requirements = analyzeFlightSchedule(flights);
  console.log('   Airport analysis:');
  for (const [airport, req] of requirements) {
    console.log(`   - ${airport}: ${req.totalFlights} flights, peak=${req.peakHourFlights}/hr, 757=${req.byAircraftType['757'] || 0}, 321=${req.byAircraftType['321'] || 0}`);
  }

  // Calculate crew needed per airport
  const crewByAirport = calculateCrewByAirport(requirements);

  const crew: CrewMember[] = [];
  let pilotCounter = 1;
  let faCounter = 1;
  let totalPilots = 0;
  let totalFAs = 0;

  console.log('\n   Crew generation by airport:');

  for (const [airport, needs] of crewByAirport) {
    console.log(`   - ${airport}: ${needs.pilots} pilots (${needs.needs757} need 757 cert), ${needs.fas} FAs`);

    // Generate pilots for this airport
    // First, generate enough 757-certified pilots
    const pilotsFor757 = Math.min(needs.pilots, needs.needs757);
    for (let i = 0; i < pilotsFor757; i++) {
      const id = `PLT${String(pilotCounter++).padStart(3, '0')}`;
      crew.push(generateCrewMember(id, 'pilot', airport, true, false, random));
    }

    // Then generate remaining pilots (some might still get 757 randomly)
    for (let i = pilotsFor757; i < needs.pilots; i++) {
      const id = `PLT${String(pilotCounter++).padStart(3, '0')}`;
      // Check if we need 321 pilots
      const needs321 = i < needs.needs321;
      crew.push(generateCrewMember(id, 'pilot', airport, false, needs321, random));
    }

    // Generate FAs for this airport
    for (let i = 0; i < needs.fas; i++) {
      const id = `FA${String(faCounter++).padStart(3, '0')}`;
      crew.push(generateCrewMember(id, 'flightAttendant', airport, false, false, random));
    }

    totalPilots += needs.pilots;
    totalFAs += needs.fas;
  }

  console.log(`\n   Total: ${totalPilots} pilots, ${totalFAs} FAs`);

  // Calculate distribution by base
  const byBase: Record<string, number> = {};
  for (const c of crew) {
    byBase[c.homeBase] = (byBase[c.homeBase] || 0) + 1;
  }

  return {
    crew,
    metadata: {
      totalPilots,
      totalFlightAttendants: totalFAs,
      byBase,
      generatedAt: new Date().toISOString()
    }
  };
}

/**
 * Main execution
 */
export function runCrewGeneration(seed: number = 42): CrewOutput {
  console.log('👥 Crew Generator');
  console.log('==================\n');

  // Load flights to calculate requirements
  const flightsPath = path.join(__dirname, 'output', 'flights.json');
  const flights = JSON.parse(fs.readFileSync(flightsPath, 'utf-8'));
  console.log(`📂 Loaded ${flights.length} flights for crew sizing`);

  // Generate
  const crewOutput = generateCrew(flights, seed);

  // Save
  const outputPath = path.join(__dirname, 'output', 'crew.json');
  fs.writeFileSync(outputPath, JSON.stringify(crewOutput, null, 2));
  console.log(`✅ Saved ${crewOutput.crew.length} crew members to crew.json`);

  // Print summary
  console.log('\n📊 Summary:');
  console.log(`   Pilots: ${crewOutput.metadata.totalPilots}`);
  console.log(`   Flight Attendants: ${crewOutput.metadata.totalFlightAttendants}`);
  console.log('\n   By Base:');
  for (const [base, count] of Object.entries(crewOutput.metadata.byBase).sort((a, b) => b[1] - a[1])) {
    console.log(`   - ${base}: ${count}`);
  }

  // Print certification distribution for pilots
  const pilots = crewOutput.crew.filter(c => c.role === 'pilot');
  const certCounts: Record<string, number> = { '738': 0, '757': 0, '321': 0 };
  for (const p of pilots) {
    for (const cert of p.certifications) {
      certCounts[cert]++;
    }
  }
  console.log('\n   Pilot Certifications:');
  for (const [type, count] of Object.entries(certCounts)) {
    const pct = ((count / pilots.length) * 100).toFixed(0);
    console.log(`   - ${type}: ${count} (${pct}%)`);
  }

  return crewOutput;
}

// Run if executed directly
if (require.main === module) {
  const seedArg = process.argv.find(arg => arg.startsWith('--seed='));
  const seed = seedArg ? parseInt(seedArg.split('=')[1]) : 42;
  runCrewGeneration(seed);
}
