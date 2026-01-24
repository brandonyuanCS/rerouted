import { CrewMember, Flight, Disruption, DashboardStats } from './types';

export const mockCrew: CrewMember[] = [
  {
    id: '1',
    employeeId: 'AA001234',
    firstName: 'Sarah',
    lastName: 'Johnson',
    role: 'pilot',
    status: 'on_duty',
    base: 'DFW',
    certifications: ['Boeing 737', 'Boeing 787', 'FAA ATP'],
    dutyHoursRemaining: 6.5,
    phone: '+1 (555) 123-4567',
    email: 'sarah.johnson@aa.com',
    currentFlightId: 'FL001',
  },
  {
    id: '2',
    employeeId: 'AA001235',
    firstName: 'Michael',
    lastName: 'Chen',
    role: 'first_officer',
    status: 'on_duty',
    base: 'DFW',
    certifications: ['Boeing 737', 'FAA Commercial'],
    dutyHoursRemaining: 7.0,
    phone: '+1 (555) 234-5678',
    email: 'michael.chen@aa.com',
    currentFlightId: 'FL001',
  },
  {
    id: '3',
    employeeId: 'AA002341',
    firstName: 'Emily',
    lastName: 'Rodriguez',
    role: 'lead_attendant',
    status: 'available',
    base: 'DFW',
    certifications: ['Safety Lead', 'First Aid Advanced'],
    dutyHoursRemaining: 10.0,
    phone: '+1 (555) 345-6789',
    email: 'emily.rodriguez@aa.com',
  },
  {
    id: '4',
    employeeId: 'AA002342',
    firstName: 'James',
    lastName: 'Williams',
    role: 'flight_attendant',
    status: 'available',
    base: 'DFW',
    certifications: ['Safety Basic', 'First Aid'],
    dutyHoursRemaining: 9.5,
    phone: '+1 (555) 456-7890',
    email: 'james.williams@aa.com',
  },
  {
    id: '5',
    employeeId: 'AA003456',
    firstName: 'Lisa',
    lastName: 'Thompson',
    role: 'pilot',
    status: 'on_break',
    base: 'ORD',
    certifications: ['Boeing 737', 'Airbus A320', 'FAA ATP'],
    dutyHoursRemaining: 4.0,
    phone: '+1 (555) 567-8901',
    email: 'lisa.thompson@aa.com',
  },
  {
    id: '6',
    employeeId: 'AA003457',
    firstName: 'David',
    lastName: 'Kim',
    role: 'first_officer',
    status: 'off_duty',
    base: 'LAX',
    certifications: ['Boeing 787', 'FAA Commercial'],
    dutyHoursRemaining: 12.0,
    phone: '+1 (555) 678-9012',
    email: 'david.kim@aa.com',
  },
  {
    id: '7',
    employeeId: 'AA004567',
    firstName: 'Amanda',
    lastName: 'Garcia',
    role: 'flight_attendant',
    status: 'on_duty',
    base: 'MIA',
    certifications: ['Safety Basic', 'First Aid', 'Language: Spanish'],
    dutyHoursRemaining: 5.5,
    phone: '+1 (555) 789-0123',
    email: 'amanda.garcia@aa.com',
    currentFlightId: 'FL002',
  },
  {
    id: '8',
    employeeId: 'AA004568',
    firstName: 'Robert',
    lastName: 'Brown',
    role: 'pilot',
    status: 'on_leave',
    base: 'JFK',
    certifications: ['Boeing 777', 'FAA ATP', 'International'],
    dutyHoursRemaining: 0,
    phone: '+1 (555) 890-1234',
    email: 'robert.brown@aa.com',
  },
];

export const mockFlights: Flight[] = [
  {
    id: 'FL001',
    flightNumber: 'AA 1234',
    origin: 'DFW',
    destination: 'LAX',
    scheduledDeparture: '2026-01-24T14:30:00Z',
    scheduledArrival: '2026-01-24T16:45:00Z',
    status: 'boarding',
    gate: 'A24',
    aircraft: 'Boeing 737-800',
    crewAssignments: [
      { id: 'CA001', flightId: 'FL001', crewMemberId: '1', role: 'Captain', status: 'confirmed', assignedAt: '2026-01-23T10:00:00Z' },
      { id: 'CA002', flightId: 'FL001', crewMemberId: '2', role: 'First Officer', status: 'confirmed', assignedAt: '2026-01-23T10:00:00Z' },
    ],
  },
  {
    id: 'FL002',
    flightNumber: 'AA 2567',
    origin: 'MIA',
    destination: 'JFK',
    scheduledDeparture: '2026-01-24T15:00:00Z',
    scheduledArrival: '2026-01-24T18:30:00Z',
    status: 'delayed',
    gate: 'B12',
    aircraft: 'Boeing 787-9',
    crewAssignments: [
      { id: 'CA003', flightId: 'FL002', crewMemberId: '7', role: 'Lead Attendant', status: 'confirmed', assignedAt: '2026-01-23T11:00:00Z' },
    ],
  },
  {
    id: 'FL003',
    flightNumber: 'AA 3891',
    origin: 'ORD',
    destination: 'DFW',
    scheduledDeparture: '2026-01-24T16:00:00Z',
    scheduledArrival: '2026-01-24T18:30:00Z',
    status: 'scheduled',
    gate: 'C8',
    aircraft: 'Airbus A321',
    crewAssignments: [],
  },
  {
    id: 'FL004',
    flightNumber: 'AA 4521',
    origin: 'LAX',
    destination: 'SEA',
    scheduledDeparture: '2026-01-24T17:15:00Z',
    scheduledArrival: '2026-01-24T19:45:00Z',
    status: 'scheduled',
    gate: 'D15',
    aircraft: 'Boeing 737 MAX 8',
    crewAssignments: [
      { id: 'CA004', flightId: 'FL004', crewMemberId: '3', role: 'Lead Attendant', status: 'pending', assignedAt: '2026-01-24T08:00:00Z' },
    ],
  },
  {
    id: 'FL005',
    flightNumber: 'AA 5678',
    origin: 'JFK',
    destination: 'LHR',
    scheduledDeparture: '2026-01-24T19:00:00Z',
    scheduledArrival: '2026-01-25T07:30:00Z',
    status: 'scheduled',
    aircraft: 'Boeing 777-300ER',
    crewAssignments: [],
  },
  {
    id: 'FL006',
    flightNumber: 'AA 6789',
    origin: 'DFW',
    destination: 'MIA',
    scheduledDeparture: '2026-01-24T13:00:00Z',
    scheduledArrival: '2026-01-24T17:00:00Z',
    actualDeparture: '2026-01-24T13:05:00Z',
    status: 'in_air',
    aircraft: 'Boeing 737-800',
    crewAssignments: [],
  },
];

export const mockDisruptions: Disruption[] = [
  {
    id: 'D001',
    type: 'delay',
    flightId: 'FL002',
    description: 'Weather delay due to thunderstorms at MIA',
    severity: 'medium',
    createdAt: '2026-01-24T12:30:00Z',
    affectedCrew: ['7'],
  },
  {
    id: 'D002',
    type: 'crew_shortage',
    flightId: 'FL003',
    description: 'Pilot called in sick, need replacement',
    severity: 'high',
    createdAt: '2026-01-24T11:00:00Z',
    affectedCrew: [],
  },
  {
    id: 'D003',
    type: 'mechanical',
    flightId: 'FL005',
    description: 'Aircraft undergoing maintenance check',
    severity: 'low',
    createdAt: '2026-01-24T10:00:00Z',
    affectedCrew: [],
  },
];

export const mockDashboardStats: DashboardStats = {
  totalFlights: 156,
  activeFlights: 42,
  delayedFlights: 8,
  totalCrew: 324,
  availableCrew: 87,
  onDutyCrew: 156,
  pendingAssignments: 12,
  activeDisruptions: 3,
};

export function getRoleLabel(role: CrewMember['role']): string {
  const labels: Record<CrewMember['role'], string> = {
    pilot: 'Captain',
    first_officer: 'First Officer',
    flight_attendant: 'Flight Attendant',
    lead_attendant: 'Lead Attendant',
  };
  return labels[role];
}

export function getStatusColor(status: CrewMember['status']): string {
  const colors: Record<CrewMember['status'], string> = {
    available: 'bg-green-500',
    on_duty: 'bg-blue-500',
    on_break: 'bg-yellow-500',
    off_duty: 'bg-gray-500',
    on_leave: 'bg-purple-500',
  };
  return colors[status];
}

export function getFlightStatusColor(status: Flight['status']): string {
  const colors: Record<Flight['status'], string> = {
    scheduled: 'bg-gray-500',
    boarding: 'bg-blue-500',
    departed: 'bg-green-500',
    in_air: 'bg-green-600',
    landed: 'bg-green-700',
    delayed: 'bg-yellow-500',
    cancelled: 'bg-red-500',
  };
  return colors[status];
}

export function getSeverityColor(severity: Disruption['severity']): string {
  const colors: Record<Disruption['severity'], string> = {
    low: 'bg-gray-500',
    medium: 'bg-yellow-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500',
  };
  return colors[severity];
}
