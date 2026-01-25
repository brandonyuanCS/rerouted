export interface CrewMember {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  role: 'pilot' | 'first_officer' | 'flight_attendant' | 'lead_attendant';
  status: 'available' | 'on_duty' | 'on_break' | 'off_duty' | 'on_leave';
  base: string;
  certifications: string[];
  dutyHoursRemaining: number;
  phone: string;
  email: string;
  currentFlightId?: string;
}

export interface Flight {
  id: string;
  flightNumber: string;
  origin: string;
  destination: string;
  scheduledDeparture: string;
  scheduledArrival: string;
  actualDeparture?: string;
  actualArrival?: string;
  status: 'scheduled' | 'boarding' | 'departed' | 'in_air' | 'landed' | 'delayed' | 'cancelled';
  gate?: string;
  aircraft: string;
  crewAssignments: CrewAssignment[];
}

export interface CrewAssignment {
  id: string;
  flightId: string;
  crewMemberId: string;
  role: string;
  status: 'pending' | 'accepted' | 'declined' | 'confirmed';
  assignedAt: string;
  respondedAt?: string;
}

export interface Disruption {
  id: string;
  type: 'delay' | 'cancellation' | 'crew_shortage' | 'weather' | 'mechanical';
  flightId: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  createdAt: string;
  resolvedAt?: string;
  affectedCrew: string[];
}

export interface Notification {
  id: string;
  type: 'assignment' | 'disruption' | 'update' | 'alert';
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  targetCrewId?: string;
}

export interface DashboardStats {
  totalFlights: number;
  activeFlights: number;
  delayedFlights: number;
  totalCrew: number;
  availableCrew: number;
  onDutyCrew: number;
  pendingAssignments: number;
  activeDisruptions: number;
}
