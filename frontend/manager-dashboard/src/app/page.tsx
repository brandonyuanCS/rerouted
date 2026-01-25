'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import dynamic from 'next/dynamic';
import { fetchDashboardData } from '@/lib/api';
import { DashboardStats, Flight, Crew, Disruption } from '@/lib/types';
import { JobSubmissionDialog } from '@/components/JobSubmissionDialog';

const FlightMap = dynamic(() => import('@/components/FlightMap'), {
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-slate-900/10 animate-pulse rounded-lg flex items-center justify-center text-muted-foreground">Loading Flight Map...</div>
});

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
// ...
export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [flights, setFlights] = useState<Flight[]>([]);
  const [allFlights, setAllFlights] = useState<Flight[]>([]);
  const [disruptions, setDisruptions] = useState<Disruption[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const data = await fetchDashboardData();
        setStats(data.summary);
        setFlights(data.flights.slice(0, 5));
        setAllFlights(data.flights);
        setDisruptions(data.disruptions);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !stats) {
    return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold text-secondary">Dashboard</h1>
          <p className="text-muted-foreground">Real-time operations overview</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground hidden md:block">
            Live Data: {stats.total_flights} flights • {stats.active_flights} active
          </div>
          <JobSubmissionDialog />
        </div>
      </div>

      {/* Flight Map Section */}
      <div className="w-full">
        <FlightMap flights={allFlights} disruptions={disruptions} />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Flights</CardTitle>
            <PlaneIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.active_flights}</div>
            <p className="text-xs text-muted-foreground">
              {stats.delayed_flights} delayed of {stats.total_flights} total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crew Status</CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{stats.total_crew}</div>
            <p className="text-xs text-muted-foreground">
              {stats.available_crew} available, {stats.on_duty_crew} on duty
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Disruptions</CardTitle>
            <AlertIcon className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{stats.delays + stats.cancellations}</div>
            <p className="text-xs text-muted-foreground">
              {stats.cancellations} cancellations, {stats.delays} delays
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Affected Crew</CardTitle>
            <UsersIcon className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stats.affected_crew}</div>
            <p className="text-xs text-muted-foreground">Crew members displaced</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Recent Flights</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Flight</TableHead>
                  <TableHead>Route</TableHead>
                  <TableHead>Departs</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {flights.map((flight) => (
                  <TableRow key={flight.flight_number}>
                    <TableCell className="font-medium">{flight.flight_number}</TableCell>
                    <TableCell>
                      {flight.origin} → {flight.destination}
                    </TableCell>
                    <TableCell>
                      {flight.scheduled_departure}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {flight.status || 'Scheduled'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active Disruptions</CardTitle>
          </CardHeader>
          <CardContent>
            {disruptions.length > 0 ? (
              <div className="space-y-4 max-h-[300px] overflow-y-auto">
                {disruptions.slice(0, 5).map((d) => (
                  <div
                    key={d.flight_number}
                    className="flex items-start gap-4 rounded-lg border p-4 bg-red-50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-red-700">{d.flight_number}</span>
                        <Badge variant="destructive" className="text-xs">
                          {d.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-red-600 mt-1">
                        {d.cause} • {d.delay_minutes ? `${d.delay_minutes} min delay` : 'Cancelled'}
                      </p>
                      <p className="text-xs text-red-400 mt-1">
                        Orig: {d.original_departure}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground">No active disruptions</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
