'use client';

import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { ResourceError, ResourceLoading } from '@/components/resource-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useApiResource } from '@/hooks/use-api-resource';
import { getPairings } from '@/lib/api';

const PAGE_SIZE = 50;
const formatMinutes = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`;

export default function AssignmentsPage() {
  const { data: pairings, error, loading, refetch } = useApiResource(getPairings);
  const [query, setQuery] = useState('');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => (pairings ?? []).filter((pairing) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [pairing.pairing_id, pairing.crew_id, pairing.crew_name, ...pairing.flights].some((value) => value.toLowerCase().includes(needle));
    return matchesQuery && (role === 'all' || pairing.crew_role === role);
  }), [pairings, query, role]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visiblePairings = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totals = {
    pairings: pairings?.length ?? 0,
    legs: pairings?.reduce((sum, pairing) => sum + pairing.flights.length, 0) ?? 0,
    dutyMinutes: pairings?.reduce((sum, pairing) => sum + pairing.total_duty_time, 0) ?? 0,
    baseReturns: pairings?.filter((pairing) => pairing.returns_to_base).length ?? 0,
  };

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-semibold tracking-tight text-slate-950">Crew pairings</h1><p className="mt-1 text-slate-600">Current flight sequences and planned duty windows</p></header>
      <GlassCard className="p-0"><dl className="grid divide-y divide-slate-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">{[['Pairings', totals.pairings.toLocaleString()], ['Assigned legs', totals.legs.toLocaleString()], ['Scheduled duty', formatMinutes(totals.dutyMinutes)], ['Return to base', totals.baseReturns.toLocaleString()]].map(([label, value]) => <div key={label} className="px-6 py-5"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{value}</dd></div>)}</dl></GlassCard>
      <GlassCard>
        <GlassCardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><GlassCardTitle>Active pairings</GlassCardTitle><p className="mt-1 text-sm text-slate-500">{filtered.length.toLocaleString()} matching records</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input aria-label="Search pairings" placeholder="Pairing, crew, or flight" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="bg-white pl-9 sm:w-64" /></div><Select value={role} onValueChange={(value) => { setRole(value); setPage(1); }}><SelectTrigger className="bg-white sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="pilot">Pilots</SelectItem><SelectItem value="flightAttendant">Flight attendants</SelectItem></SelectContent></Select></div></div></GlassCardHeader>
        <GlassCardContent>{loading && !pairings ? <ResourceLoading label="Loading crew pairings" /> : error && !pairings ? <ResourceError message={error} onRetry={() => void refetch()} /> : <><div className="overflow-x-auto rounded-xl border border-slate-200"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Pairing</TableHead><TableHead>Crew member</TableHead><TableHead>Role</TableHead><TableHead>Flight sequence</TableHead><TableHead>Duty window</TableHead><TableHead>Duty time</TableHead><TableHead>Base return</TableHead></TableRow></TableHeader><TableBody>{visiblePairings.map((pairing) => <TableRow key={pairing.pairing_id} className="hover:bg-slate-50"><TableCell className="font-mono text-blue-700">{pairing.pairing_id}</TableCell><TableCell><div className="font-medium text-slate-900">{pairing.crew_name}</div><div className="font-mono text-xs text-slate-500">{pairing.crew_id}</div></TableCell><TableCell>{pairing.crew_role === 'flightAttendant' ? 'Flight attendant' : 'Pilot'}</TableCell><TableCell><div className="flex max-w-xs flex-wrap gap-1">{pairing.flights.map((flight) => <Badge key={flight} variant="secondary" className="font-mono font-normal">{flight}</Badge>)}</div></TableCell><TableCell className="whitespace-nowrap tabular-nums">{pairing.duty_start.slice(0, 5)}–{pairing.duty_end.slice(0, 5)}</TableCell><TableCell className="whitespace-nowrap tabular-nums">{formatMinutes(pairing.total_duty_time)}</TableCell><TableCell>{pairing.returns_to_base ? 'Yes' : 'No'}</TableCell></TableRow>)}</TableBody></Table></div><div className="mt-4 flex items-center justify-between text-sm text-slate-600"><span>Page {page} of {pageCount}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div></>}</GlassCardContent>
      </GlassCard>
    </div>
  );
}
