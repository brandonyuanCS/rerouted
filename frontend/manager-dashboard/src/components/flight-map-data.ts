export interface Airport {
  lat: number;
  lng: number;
  name: string;
}

export const AIRPORTS: Record<string, Airport> = {
  DFW: { lat: 32.8998, lng: -97.0403, name: 'Dallas/Fort Worth' },
  ORD: { lat: 41.9742, lng: -87.9073, name: "Chicago O'Hare" },
  LAX: { lat: 33.9416, lng: -118.4085, name: 'Los Angeles' },
  JFK: { lat: 40.6413, lng: -73.7781, name: 'New York JFK' },
  MIA: { lat: 25.7959, lng: -80.287, name: 'Miami' },
  ATL: { lat: 33.6407, lng: -84.4277, name: 'Atlanta' },
  DEN: { lat: 39.8561, lng: -104.6737, name: 'Denver' },
  PHX: { lat: 33.4373, lng: -112.0078, name: 'Phoenix' },
  SEA: { lat: 47.4502, lng: -122.3088, name: 'Seattle' },
  CLT: { lat: 35.214, lng: -80.9431, name: 'Charlotte' },
  BOS: { lat: 42.3656, lng: -71.0096, name: 'Boston' },
  PHL: { lat: 39.8729, lng: -75.2437, name: 'Philadelphia' },
};

export interface FlightRoute {
  origin: string;
  destination: string;
  flightNumber: string;
  status: 'normal' | 'disrupted' | 'recovered';
}
