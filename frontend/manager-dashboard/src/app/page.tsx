import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  mockDashboardStats,
  mockFlights,
  mockDisruptions,
  mockCrew,
  getFlightStatusColor,
  getSeverityColor,
} from '@/lib/mock-data';

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

export default function DashboardPage() {
  const stats = mockDashboardStats;
  const recentFlights = mockFlights.slice(0, 5);
  const activeDisruptions = mockDisruptions.filter((d) => !d.resolvedAt);
  const availableCrew = mockCrew.filter((c) => c.status === 'available').slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Dashboard</h1>
        <p className="text-slate-600">Real-time operations overview</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Active Flights</GlassCardTitle>
            <div className="h-8 w-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
              <PlaneIcon className="h-4 w-4 text-blue-600" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-blue-600">{stats.activeFlights}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.delayedFlights} delayed of {stats.totalFlights} total
            </p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Available Crew</GlassCardTitle>
            <div className="h-8 w-8 rounded-xl bg-green-500/20 flex items-center justify-center">
              <UsersIcon className="h-4 w-4 text-green-600" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-green-600">{stats.availableCrew}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.onDutyCrew} on duty of {stats.totalCrew} total
            </p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Pending Assignments</GlassCardTitle>
            <div className="h-8 w-8 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <ClockIcon className="h-4 w-4 text-amber-600" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-amber-600">{stats.pendingAssignments}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting crew response</p>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <GlassCardTitle className="text-sm font-medium">Active Disruptions</GlassCardTitle>
            <div className="h-8 w-8 rounded-xl bg-red-500/20 flex items-center justify-center">
              <AlertIcon className="h-4 w-4 text-red-600" />
            </div>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-3xl font-bold text-red-600">{stats.activeDisruptions}</div>
            <p className="text-xs text-gray-500 mt-1">Requiring attention</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Upcoming Flights</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-white hover:bg-white/10">
                    <TableHead className="text-gray-700">Flight</TableHead>
                    <TableHead className="text-gray-700">Route</TableHead>
                    <TableHead className="text-gray-700">Departure</TableHead>
                    <TableHead className="text-gray-700">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFlights.map((flight) => (
                    <TableRow key={flight.id} className="border-b border-white hover:bg-white/20 transition-colors">
                      <TableCell className="font-medium text-gray-800">{flight.flightNumber}</TableCell>
                      <TableCell className="text-gray-700">
                        {flight.origin} - {flight.destination}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {new Date(flight.scheduledDeparture).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getFlightStatusColor(flight.status)} text-slate-800 liquid-glass-badge border-0`}>
                          {flight.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCardContent>
        </GlassCard>

        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Active Disruptions</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            {activeDisruptions.length > 0 ? (
              <div className="space-y-3">
                {activeDisruptions.map((disruption) => {
                  const flight = mockFlights.find((f) => f.id === disruption.flightId);
                  return (
                    <div
                      key={disruption.id}
                      className="flex items-start gap-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 p-4 hover:bg-white/30 transition-all"
                    >
                      <div className={`mt-1 h-3 w-3 rounded-full ${getSeverityColor(disruption.severity)} shadow-lg`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-gray-800">{flight?.flightNumber}</span>
                          <Badge variant="outline" className="text-xs bg-white/30 border-white/40">
                            {disruption.type.replace('_', ' ')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{disruption.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-gray-500">No active disruptions</p>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle>Available Crew Members</GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white hover:bg-white/10">
                  <TableHead className="text-gray-700">Name</TableHead>
                  <TableHead className="text-gray-700">Role</TableHead>
                  <TableHead className="text-gray-700">Base</TableHead>
                  <TableHead className="text-gray-700">Duty Hours Left</TableHead>
                  <TableHead className="text-gray-700">Certifications</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {availableCrew.map((crew) => (
                  <TableRow key={crew.id} className="border-b border-white hover:bg-white/20 transition-colors">
                    <TableCell className="font-medium text-gray-800">
                      {crew.firstName} {crew.lastName}
                    </TableCell>
                    <TableCell className="capitalize text-gray-700">{crew.role.replace('_', ' ')}</TableCell>
                    <TableCell className="text-gray-700">{crew.base}</TableCell>
                    <TableCell className="text-gray-700">{crew.dutyHoursRemaining}h</TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {crew.certifications.slice(0, 2).map((cert) => (
                          <Badge key={cert} variant="outline" className="text-xs bg-white/30 border-white/40 text-gray-700">
                            {cert}
                          </Badge>
                        ))}
                        {crew.certifications.length > 2 && (
                          <Badge variant="outline" className="text-xs bg-white/30 border-white/40 text-gray-700">
                            +{crew.certifications.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
