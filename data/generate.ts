
import fs from 'fs';
import path from 'path';
import haversine from 'haversine-distance';
import { aircraft as aircraftList } from './Flight-Engine/src/data/aircraft';
import { airports as airportList } from './Flight-Engine/src/data/airports';
import { Airport, Aircraft } from './Flight-Engine/src/types';

const AA_HUBS_CODES = ["DFW", "ORD", "CLT", "MIA", "PHX", "PHL", "LAX", "JFK", "DCA"];

function getAirport(code: string): Airport | undefined {
  return airportList.find(a => a.code === code);
}

function generateFlightSchedule() {
  const flights: any[] = [];
  let flightCounter = 1000;

  // Get Hub Objects
  const hubs = AA_HUBS_CODES.map(code => getAirport(code)).filter((a): a is Airport => !!a);

  // Generate hub-to-hub flights
  hubs.forEach(origin => {
    hubs.forEach(destination => {
      if (origin.code === destination.code) return;

      // 2-4 daily flights between major hubs
      const dailyFlights = origin.code === "DFW" || destination.code === "DFW" ? 4 : 2;

      for (let i = 0; i < dailyFlights; i++) {
        const departureHour = 6 + (i * 4); // Spread throughout day
        const aircraft = selectAircraft(origin, destination);

        // Calculate distance
        const distance = Math.round(metersToMiles(haversine(origin.location, destination.location)));
        const duration = calculateFlightTime(distance, aircraft.speed);

        flights.push({
          flightNumber: `AA${flightCounter++}`,
          origin: origin.code,
          destination: destination.code,
          aircraft: aircraft.model,
          scheduledDeparture: createTimeString(departureHour, 0),
          scheduledArrival: createTimeString(departureHour, duration),
          duration, // minutes
          distance,
          typical_passenger_count: aircraft.passengerCapacity.main,
          // crew_required not available in source data, so we omit or mock if strictly needed
        });
      }
    });
  });

  // Add spoke routes (hub to smaller cities)
  // We'll use other airports in the list as spokes
  const spokeDestinations = airportList.filter(a => !AA_HUBS_CODES.includes(a.code));

  hubs.forEach(hub => {
    spokeDestinations.forEach(spoke => {
      // Randomly decide if there is a route
      if (Math.random() > 0.7) return;

      const dailyFlights = 1 + Math.floor(Math.random() * 2);

      for (let i = 0; i < dailyFlights; i++) {
        const departureHour = 8 + Math.floor(Math.random() * 8);
        const aircraft = aircraftList.find(a => a.model === '321') || aircraftList[0]; // Prefer smaller

        const distance = Math.round(metersToMiles(haversine(hub.location, spoke.location)));
        const duration = calculateFlightTime(distance, aircraft.speed);

        flights.push({
          flightNumber: `AA${flightCounter++}`,
          origin: hub.code,
          destination: spoke.code,
          aircraft: aircraft.model,
          scheduledDeparture: createTimeString(departureHour, 0),
          scheduledArrival: createTimeString(departureHour, duration),
          duration,
          distance,
          typical_passenger_count: aircraft.passengerCapacity.main
        });
      }
    });
  });

  return flights;
}

function createTimeString(hour: number, additionalMinutes: number) {
  const totalMinutes = (hour * 60) + additionalMinutes;
  const finalHour = Math.floor(totalMinutes / 60) % 24;
  const finalMinute = Math.floor(totalMinutes % 60);

  // Return as ISO time (you can add full date later)
  return `${String(finalHour).padStart(2, '0')}:${String(finalMinute).padStart(2, '0')}:00`;
}

function selectAircraft(origin: Airport, destination: Airport): Aircraft {
  const distance = Math.round(metersToMiles(haversine(origin.location, destination.location)));

  // Simple logic based on available aircraft in Flight-Engine
  // Models: 738, 757, 321
  if (distance > 1500) {
    return aircraftList.find(a => a.model === '757') || aircraftList[0];
  }
  return aircraftList.find(a => a.model === '738') || aircraftList[0];
}

function metersToMiles(meters: number): number {
  return meters / 1609.344;
}

function calculateFlightTime(distanceMiles: number, speedMph: number) {
  // Simple approximation + taxi time
  return Math.round((distanceMiles / speedMph) * 60) + 30;
}

// Generate and save
const flights = generateFlightSchedule();

const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir);
}

fs.writeFileSync(
  path.join(outputDir, 'flights.json'),
  JSON.stringify(flights, null, 2)
);

console.log(`✅ Generated ${flights.length} flights`);
console.log(`📁 Saved to output/flights.json`);

// Also generate a summary
const summary = {
  total_flights: flights.length,
  unique_routes: new Set(flights.map(f => `${f.origin}-${f.destination}`)).size,
  airports_served: new Set([...flights.map(f => f.origin), ...flights.map(f => f.destination)]).size,
  aircraft_types: [...new Set(flights.map(f => f.aircraft))],
  generated_at: new Date().toISOString()
};

fs.writeFileSync(
  path.join(outputDir, 'summary.json'),
  JSON.stringify(summary, null, 2)
);

console.log('\n📊 Summary:', summary);