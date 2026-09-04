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
import { getDisruptions } from '@/lib/api';

const PAGE_SIZE = 50;
const causeLabel = (cause: string) => cause.replaceAll('_', ' ');

export default function DisruptionsPage() {
  const { data: disruptions, error, loading, refetch } = useApiResource(getDisruptions);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => (disruptions ?? []).filter((disruption) => {
    const needle = query.trim().toLowerCase();
    const matchesQuery = !needle || [disruption.flight_number, disruption.origin, disruption.destination, disruption.cause].some((value) => value.toLowerCase().includes(needle));
    return matchesQuery && (type === 'all' || disruption.type === type);
  }), [disruptions, query, type]);
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visibleDisruptions = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const counts = {
    total: disruptions?.length ?? 0,
    delays: disruptions?.filter((disruption) => disruption.type === 'delay').length ?? 0,
    cancellations: disruptions?.filter((disruption) => disruption.type === 'cancellation').length ?? 0,
    cascades: disruptions?.filter((disruption) => disruption.is_cascade).length ?? 0,
  };

  return (
    <div className="space-y-6">
      <header><h1 className="text-3xl font-semibold tracking-tight text-slate-950">Disruptions</h1><p className="mt-1 text-slate-600">Current operational impact across the network</p></header>
      <GlassCard className="p-0"><dl className="grid divide-y divide-slate-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">{[['Total disruptions', counts.total], ['Delayed', counts.delays], ['Cancelled', counts.cancellations], ['Cascading', counts.cascades]].map(([label, value]) => <div key={label} className="px-6 py-5"><dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{value}</dd></div>)}</dl></GlassCard>
      <GlassCard>
        <GlassCardHeader><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><GlassCardTitle>Operational events</GlassCardTitle><p className="mt-1 text-sm text-slate-500">{filtered.length.toLocaleString()} matching records</p></div><div className="flex flex-col gap-2 sm:flex-row"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" /><Input aria-label="Search disruptions" placeholder="Flight, airport, or cause" value={query} onChange={(event) => { setQuery(event.target.value); setPage(1); }} className="bg-white pl-9 sm:w-64" /></div><Select value={type} onValueChange={(value) => { setType(value); setPage(1); }}><SelectTrigger className="bg-white sm:w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All types</SelectItem><SelectItem value="delay">Delays</SelectItem><SelectItem value="cancellation">Cancellations</SelectItem></SelectContent></Select></div></div></GlassCardHeader>
        <GlassCardContent>{loading && !disruptions ? <ResourceLoading label="Loading disruptions" /> : error && !disruptions ? <ResourceError message={error} onRetry={() => void refetch()} /> : <><div className="overflow-x-auto rounded-xl border border-slate-200"><Table><TableHeader><TableRow className="bg-slate-50 hover:bg-slate-50"><TableHead>Flight</TableHead><TableHead>Route</TableHead><TableHead>Type</TableHead><TableHead>Cause</TableHead><TableHead>Delay</TableHead><TableHead>Departure</TableHead><TableHead>Cascade</TableHead></TableRow></TableHeader><TableBody>{visibleDisruptions.map((disruption) => <TableRow key={disruption.flight_number} className="hover:bg-slate-50"><TableCell className="font-mono font-medium text-blue-700">{disruption.flight_number}</TableCell><TableCell>{disruption.origin} → {disruption.destination}</TableCell><TableCell><Badge variant="outline" className={disruption.type === 'cancellation' ? 'border-red-200 bg-red-50 text-red-800' : 'border-amber-200 bg-amber-50 text-amber-800'}>{disruption.type}</Badge></TableCell><TableCell className="capitalize">{causeLabel(disruption.cause)}</TableCell><TableCell className="tabular-nums">{disruption.delay_minutes == null ? '—' : `${disruption.delay_minutes} min`}</TableCell><TableCell className="tabular-nums">{disruption.original_departure.slice(11, 16) || disruption.original_departure.slice(0, 5)}</TableCell><TableCell>{disruption.is_cascade ? 'Yes' : 'No'}</TableCell></TableRow>)}</TableBody></Table></div><div className="mt-4 flex items-center justify-between text-sm text-slate-600"><span>Page {page} of {pageCount}</span><div className="flex gap-2"><Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><Button variant="outline" size="sm" disabled={page === pageCount} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div></>}</GlassCardContent>
      </GlassCard>
    </div>
  );
}
