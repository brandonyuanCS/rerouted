'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { ResourceError, ResourceLoading } from '@/components/resource-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApiResource } from '@/hooks/use-api-resource';
import { getFlights, type ApiFlight } from '@/lib/api';

const PAGE_SIZE = 50;

function formatTime(value: string): string {
  if (value.includes('T')) {
    return new Date(value).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }
  return value.slice(0, 5);
}

function getStatus(flight: ApiFlight): string {
  return flight.disruption_type ?? 'scheduled';
}

function statusClasses(status: string): string {
  if (status === 'cancellation') return 'border-red-200 bg-red-50 text-red-800';
  if (status === 'delay') return 'border-amber-200 bg-amber-50 text-amber-800';
  return 'border-slate-200 bg-slate-50 text-slate-700';
}

function FlightDetails({ flight }: { flight: ApiFlight }) {
  const status = getStatus(flight);
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{flight.flight_number}</DialogTitle>
        <DialogDescription>{flight.origin} → {flight.destination}</DialogDescription>
      </DialogHeader>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
        <div><dt className="text-slate-500">Status</dt><dd className="mt-1"><Badge variant="outline" className={statusClasses(status)}>{status}</Badge></dd></div>
        <div><dt className="text-slate-500">Aircraft</dt><dd className="mt-1 font-medium text-slate-900">{flight.aircraft}</dd></div>
        <div><dt className="text-slate-500">Departure</dt><dd className="mt-1 font-medium text-slate-900">{formatTime(flight.scheduled_departure)}</dd></div>
        <div><dt className="text-slate-500">Arrival</dt><dd className="mt-1 font-medium text-slate-900">{formatTime(flight.scheduled_arrival)}</dd></div>
        <div><dt className="text-slate-500">Duration</dt><dd className="mt-1 font-medium text-slate-900">{flight.duration} minutes</dd></div>
        <div><dt className="text-slate-500">Distance</dt><dd className="mt-1 font-medium text-slate-900">{flight.distance.toLocaleString()} miles</dd></div>
        <div><dt className="text-slate-500">Assigned crew</dt><dd className="mt-1 font-medium text-slate-900">{flight.assigned_crew}</dd></div>
        <div><dt className="text-slate-500">Capacity</dt><dd className="mt-1 font-medium text-slate-900">{flight.passenger_capacity}</dd></div>
      </dl>
      {flight.delay_minutes != null && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Current delay: {flight.delay_minutes} minutes</p>}
    </DialogContent>
  );
}

export default function FlightsPage() {
  const { data: flights, error, loading, refetch } = useApiResource(getFlights);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => (flights ?? []).filter((flight) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [flight.flight_number, flight.origin, flight.destination, flight.aircraft]
      .some((value) => value.toLowerCase().includes(needle));
    return matchesQuery && (status === 'all' || getStatus(flight) === status);
  }), [flights, query, status]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleFlights = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const counts = {
    total: flights?.length ?? 0,
    delayed: flights?.filter((flight) => flight.disruption_type === 'delay').length ?? 0,
    cancelled: flights?.filter((flight) => flight.disruption_type === 'cancellation').length ?? 0,
    covered: flights?.filter((flight) => flight.assigned_crew >= 5).length ?? 0,
  };

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-semibold tracking-tight text-slate-950">Flights</h1><p className="mt-1 text-slate-600">Live schedule coverage and disruption status</p></header>
      <GlassCard className="p-0">
        <dl className="grid divide-y divide-slate-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          {[['Total flights', counts.total], ['Delayed', counts.delayed], ['Cancelled', counts.cancelled], ['Fully crewed', counts.covered]].map(([label, value]) => (
            <div key={label} className="px-6 py-5"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{value}</dd></div>
          ))}
        </dl>
      </GlassCard>
      <GlassCard>
        <GlassCardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div><GlassCardTitle>Flight schedule</GlassCardTitle><p className="mt-1 text-sm text-slate-500">{filtered.length.toLocaleString()} matching records</p></div>
            <div className="flex flex-col gap-2 sm:flex-row">
              <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input aria-label="Search flights" placeholder="Flight, airport, or aircraft" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="w-full bg-white pl-9 sm:w-64" /></div>
              <Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger className="w-full bg-white sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="scheduled">Scheduled</SelectItem><SelectItem value="delay">Delayed</SelectItem><SelectItem value="cancellation">Cancelled</SelectItem></SelectContent></Select>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          {loading && !flights ? <ResourceLoading label="Loading flight schedule" /> : error && !flights ? <ResourceError message={error} onRetry={() => void refetch()} /> : (
            <>
              <div className="overflow-x-auto rounded-xl border border-slate-200"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Flight</TableHead><TableHead>Route</TableHead><TableHead>Departure</TableHead><TableHead>Aircraft</TableHead><TableHead>Crew</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Details</TableHead></TableRow></TableHeader><TableBody>
                {visibleFlights.map((flight) => { const flightStatus = getStatus(flight); return <TableRow key={flight.flight_number} className="hover:bg-slate-50"><TableCell className="font-mono font-medium text-blue-700">{flight.flight_number}</TableCell><TableCell>{flight.origin} → {flight.destination}</TableCell><TableCell className="tabular-nums">{formatTime(flight.scheduled_departure)}</TableCell><TableCell>{flight.aircraft}</TableCell><TableCell>{flight.assigned_crew}/5</TableCell><TableCell><Badge variant="outline" className={statusClasses(flightStatus)}>{flightStatus}</Badge></TableCell><TableCell className="text-right"><Dialog><DialogTrigger asChild><Button variant="ghost" size="sm">View</Button></DialogTrigger><FlightDetails flight={flight} /></Dialog></TableCell></TableRow>; })}
              </TableBody></Table></div>
              <div className="mt-4 flex items-center justify-between text-sm text-slate-600"><span>Page {page} of {pageCount}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div>
            </>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
