/**
 * Master Data Generation Script
 * 
 * PURPOSE:
 * Single entry point to regenerate all simulation data from flights.json.
 * Runs all generators in the correct dependency order.
 * 
 * USAGE:
 *   npx ts-node generateAll.ts              # Default seed (42)
 *   npx ts-node generateAll.ts --seed 123   # Custom seed for reproducibility
 * 
 * EXECUTION ORDER (dependencies):
 * 1. Aircraft Generator
 *    - Input: flights.json
 *    - Output: aircraft.json, flights_enriched.json
 * 
 * 2. Crew Generator
 *    - Input: flights.json (for sizing)
 *    - Output: crew.json
 * 
 * 3. Pairing Generator
 *    - Input: flights_enriched.json, crew.json
 *    - Output: crew_pairings.json
 * 
 * 4. Disruption Generator
 *    - Input: flights_enriched.json, aircraft.json, crew_pairings.json
 *    - Output: disruptions.json
 * 
 * 5. Update summary.json with complete statistics
 * 
 * OUTPUT FILES:
 *   output/
 *   ├── flights.json           (unchanged - source of truth)
 *   ├── flights_enriched.json  (flights + aircraft IDs)
 *   ├── aircraft.json          (fleet roster)
 *   ├── crew.json              (all crew members)
 *   ├── crew_pairings.json     (crew -> flight assignments)
 *   ├── disruptions.json       (delays/cancellations for HPC)
 *   └── summary.json           (updated statistics)
 */

import fs from 'fs';
import path from 'path';

import { runAircraftGeneration } from './generateAircraft';
import { runCrewGeneration } from './generateCrew';
import { runPairingGeneration } from './generatePairings';
import { runDisruptionGeneration } from './generateDisruptions';

interface Summary {
  // Flight stats
  totalFlights: number;
  uniqueRoutes: number;
  airportsServed: number;
  aircraftTypes: string[];

  // Aircraft stats
  totalAircraft: number;
  aircraftByType: Record<string, number>;

  // Crew stats
  totalCrew: number;
  pilots: number;
  flightAttendants: number;
  crewByBase: Record<string, number>;

  // Pairing stats
  totalPairings: number;
  avgLegsPerPairing: number;
  crewReturningToBase: number;
  unassignedFlights: number;

  // Disruption stats
  totalDisruptions: number;
  delays: number;
  cancellations: number;
  cascadingDelays: number;
  crewAffected: number;

  // Meta
  seed: number;
  generatedAt: string;
}

function generateSummary(seed: number): Summary {
  const outputDir = path.join(__dirname, 'output');

  // Load all generated files
  const flights = JSON.parse(fs.readFileSync(path.join(outputDir, 'flights.json'), 'utf-8'));
  const aircraft = JSON.parse(fs.readFileSync(path.join(outputDir, 'aircraft.json'), 'utf-8'));
  const crew = JSON.parse(fs.readFileSync(path.join(outputDir, 'crew.json'), 'utf-8'));
  const pairings = JSON.parse(fs.readFileSync(path.join(outputDir, 'crew_pairings.json'), 'utf-8'));
  const disruptions = JSON.parse(fs.readFileSync(path.join(outputDir, 'disruptions.json'), 'utf-8'));

  return {
    // Flight stats
    totalFlights: flights.length,
    uniqueRoutes: new Set(flights.map((f: any) => `${f.origin}-${f.destination}`)).size,
    airportsServed: new Set([
      ...flights.map((f: any) => f.origin),
      ...flights.map((f: any) => f.destination)
    ]).size,
    aircraftTypes: [...new Set(flights.map((f: any) => f.aircraft))] as string[],

    // Aircraft stats
    totalAircraft: aircraft.metadata.totalAircraft,
    aircraftByType: aircraft.metadata.byType,

    // Crew stats
    totalCrew: crew.crew.length,
    pilots: crew.metadata.totalPilots,
    flightAttendants: crew.metadata.totalFlightAttendants,
    crewByBase: crew.metadata.byBase,

    // Pairing stats
    totalPairings: pairings.metadata.totalPairings,
    avgLegsPerPairing: pairings.metadata.avgLegsPerPairing,
    crewReturningToBase: pairings.metadata.crewReturningToBase,
    unassignedFlights: pairings.unassignedFlights.length,

    // Disruption stats
    totalDisruptions: disruptions.metadata.totalDisruptions,
    delays: disruptions.metadata.delays,
    cancellations: disruptions.metadata.cancellations,
    cascadingDelays: disruptions.metadata.cascadingDelays,
    crewAffected: disruptions.metadata.crewAffected,

    // Meta
    seed,
    generatedAt: new Date().toISOString()
  };
}

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║       AA Flight Delay Simulation - Data Generator             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Parse seed argument
  const seedArg = process.argv.find(arg => arg.startsWith('--seed='));
  const seed = seedArg ? parseInt(seedArg.split('=')[1]) : 42;
  console.log(`🎲 Using seed: ${seed}\n`);

  const startTime = Date.now();

  // Step 1: Aircraft
  console.log('━'.repeat(60));
  console.log('STEP 1/4: Generating Aircraft Rotations');
  console.log('━'.repeat(60));
  runAircraftGeneration(seed);
  console.log();

  // Step 2: Crew
  console.log('━'.repeat(60));
  console.log('STEP 2/4: Generating Crew Members');
  console.log('━'.repeat(60));
  runCrewGeneration(seed);
  console.log();

  // Step 3: Pairings
  console.log('━'.repeat(60));
  console.log('STEP 3/4: Generating Crew Pairings');
  console.log('━'.repeat(60));
  runPairingGeneration(seed);
  console.log();

  // Step 4: Disruptions
  console.log('━'.repeat(60));
  console.log('STEP 4/4: Generating Disruptions');
  console.log('━'.repeat(60));
  runDisruptionGeneration(seed);
  console.log();

  // Generate and save summary
  console.log('━'.repeat(60));
  console.log('Generating Summary');
  console.log('━'.repeat(60));
  const summary = generateSummary(seed);
  const summaryPath = path.join(__dirname, 'output', 'summary.json');
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));
  console.log('✅ Saved summary.json\n');

  // Final report
  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║                     GENERATION COMPLETE                       ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log();
  console.log('📊 Final Statistics:');
  console.log(`   Flights:      ${summary.totalFlights}`);
  console.log(`   Aircraft:     ${summary.totalAircraft}`);
  console.log(`   Crew:         ${summary.totalCrew} (${summary.pilots} pilots, ${summary.flightAttendants} FAs)`);
  console.log(`   Pairings:     ${summary.totalPairings}`);
  console.log(`   Disruptions:  ${summary.totalDisruptions} (${summary.delays} delays, ${summary.cancellations} cancellations)`);
  console.log(`   Crew Affected: ${summary.crewAffected}`);
  console.log();
  console.log('📁 Output Files:');
  console.log('   output/flights.json          (original - unchanged)');
  console.log('   output/flights_enriched.json (with aircraft IDs)');
  console.log('   output/aircraft.json         (fleet roster)');
  console.log('   output/crew.json             (crew members)');
  console.log('   output/crew_pairings.json    (crew -> flight assignments)');
  console.log('   output/disruptions.json      (delays/cancellations for HPC)');
  console.log('   output/summary.json          (statistics)');
  console.log();
  console.log(`⏱️  Completed in ${elapsed}s`);
}

main().catch(err => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
