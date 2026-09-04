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
import { getCrew, type ApiCrewMember } from '@/lib/api';

const PAGE_SIZE = 50;

const roleLabel = (role: ApiCrewMember['role']) => role === 'pilot' ? 'Pilot' : 'Flight attendant';
const statusLabel = (status: ApiCrewMember['status']) => status.replace('_', ' ');
const statusClasses = (status: ApiCrewMember['status']) => ({
  available: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  on_duty: 'border-blue-200 bg-blue-50 text-blue-800',
  resting: 'border-amber-200 bg-amber-50 text-amber-800',
  day_off: 'border-slate-200 bg-slate-50 text-slate-700',
}[status]);

function CrewDetails({ crew }: { crew: ApiCrewMember }) {
  return (
    <DialogContent className="max-w-lg">
      <DialogHeader><DialogTitle>{crew.name}</DialogTitle><DialogDescription>{crew.crew_id} · {roleLabel(crew.role)}</DialogDescription></DialogHeader>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-5 text-sm">
        <div><dt className="text-slate-500">Status</dt><dd className="mt-1"><Badge variant="outline" className={statusClasses(crew.status)}>{statusLabel(crew.status)}</Badge></dd></div>
        <div><dt className="text-slate-500">Home base</dt><dd className="mt-1 font-medium">{crew.home_base}</dd></div>
        <div><dt className="text-slate-500">Current location</dt><dd className="mt-1 font-medium">{crew.current_location}</dd></div>
        <div><dt className="text-slate-500">Consecutive duty days</dt><dd className="mt-1 font-medium">{crew.consecutive_duty_days}</dd></div>
        <div><dt className="text-slate-500">Duty today</dt><dd className="mt-1 font-medium">{(crew.duty_time_today / 60).toFixed(1)} hours</dd></div>
        <div><dt className="text-slate-500">Flight time today</dt><dd className="mt-1 font-medium">{(crew.flight_time_today / 60).toFixed(1)} hours</dd></div>
      </dl>
      <div><p className="mb-2 text-sm text-slate-500">Aircraft certifications</p><div className="flex flex-wrap gap-2">{crew.certifications.map((certification) => <Badge key={certification} variant="secondary">{certification}</Badge>)}</div></div>
    </DialogContent>
  );
}

export default function CrewPage() {
  const { data: crew, error, loading, refetch } = useApiResource(getCrew);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [role, setRole] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => (crew ?? []).filter((member) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [member.name, member.crew_id, member.home_base, member.current_location].some((value) => value.toLowerCase().includes(needle));
    return matchesQuery && (status === 'all' || member.status === status) && (role === 'all' || member.role === role);
  }), [crew, query, role, status]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleCrew = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const counts = { total: crew?.length ?? 0, available: crew?.filter((member) => member.status === 'available').length ?? 0, onDuty: crew?.filter((member) => member.status === 'on_duty').length ?? 0, pilots: crew?.filter((member) => member.role === 'pilot').length ?? 0 };

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-semibold tracking-tight text-slate-950">Crew roster</h1><p className="mt-1 text-slate-600">Availability, duty utilization, and qualifications</p></header>
      <GlassCard className="p-0"><dl className="grid divide-y divide-slate-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">{[['Total crew', counts.total], ['Available', counts.available], ['On duty', counts.onDuty], ['Pilots', counts.pilots]].map(([label, value]) => <div key={label} className="px-6 py-5"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{value}</dd></div>)}</dl></GlassCard>
      <GlassCard>
        <GlassCardHeader><div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between"><div><GlassCardTitle>Personnel</GlassCardTitle><p className="mt-1 text-sm text-slate-500">{filtered.length.toLocaleString()} matching records</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input aria-label="Search crew" placeholder="Name, ID, or airport" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="bg-white pl-9 sm:w-64" /></div><Select value={status} onValueChange={(value) => { setStatus(value); setPage(1); }}><SelectTrigger className="bg-white sm:w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="available">Available</SelectItem><SelectItem value="on_duty">On duty</SelectItem><SelectItem value="resting">Resting</SelectItem><SelectItem value="day_off">Day off</SelectItem></SelectContent></Select><Select value={role} onValueChange={(value) => { setRole(value); setPage(1); }}><SelectTrigger className="bg-white sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All roles</SelectItem><SelectItem value="pilot">Pilot</SelectItem><SelectItem value="flightAttendant">Flight attendant</SelectItem></SelectContent></Select></div></div></GlassCardHeader>
        <GlassCardContent>{loading && !crew ? <ResourceLoading label="Loading crew roster" /> : error && !crew ? <ResourceError message={error} onRetry={() => void refetch()} /> : <><div className="overflow-x-auto rounded-xl border border-slate-200"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Crew ID</TableHead><TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Base</TableHead><TableHead>Location</TableHead><TableHead>Status</TableHead><TableHead>Duty today</TableHead><TableHead className="text-right">Details</TableHead></TableRow></TableHeader><TableBody>{visibleCrew.map((member) => <TableRow key={member.crew_id} className="hover:bg-slate-50"><TableCell className="font-mono text-blue-700">{member.crew_id}</TableCell><TableCell className="font-medium text-slate-900">{member.name}</TableCell><TableCell>{roleLabel(member.role)}</TableCell><TableCell>{member.home_base}</TableCell><TableCell>{member.current_location}</TableCell><TableCell><Badge variant="outline" className={statusClasses(member.status)}>{statusLabel(member.status)}</Badge></TableCell><TableCell className="tabular-nums">{(member.duty_time_today / 60).toFixed(1)}h</TableCell><TableCell className="text-right"><Dialog><DialogTrigger asChild><Button variant="ghost" size="sm">View</Button></DialogTrigger><CrewDetails crew={member} /></Dialog></TableCell></TableRow>)}</TableBody></Table></div><div className="mt-4 flex items-center justify-between text-sm text-slate-600"><span>Page {page} of {pageCount}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div></>}</GlassCardContent>
      </GlassCard>
    </div>
  );
}
