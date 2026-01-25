export type CrewRole = 'pilot' | 'flightAttendant';
export type CrewStatus = 'available' | 'on_duty' | 'resting' | 'day_off';

export interface Crew {
  crew_id: string;
  name: string;
  role: CrewRole;
  status: CrewStatus;
  base: string;
  current_location: string;
  certifications: string[];
  duty_time_today: number;
  flight_time_today: number;
  last_rest_end: string;
}

export interface Flight {
  flight_number: string;
  origin: string;
  destination: string;
  scheduled_departure: string;
  scheduled_arrival: string;
  aircraft: string;
  duration: number;
  status?: string;
}

export interface Disruption {
  flight_number: string;
  type: 'delay' | 'cancellation';
  cause: string;
  original_departure: string;
  new_departure?: string;
  delay_minutes?: number;
}

export interface DashboardStats {
  total_flights: number;
  active_flights: number;
  delayed_flights: number;
  total_crew: number;
  available_crew: number;
  on_duty_crew: number;
  affected_crew: number;
  delays: number;
  cancellations: number;
}
