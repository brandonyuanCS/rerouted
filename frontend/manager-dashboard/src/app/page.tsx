'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, Cpu, LoaderCircle, Plane, SlidersHorizontal } from 'lucide-react';
import { ResourceError, ResourceLoading } from '@/components/resource-state';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FlightMap, FlightRoute, AIRPORTS } from '@/components/flight-map';
import { OptimizationModal } from '@/components/optimization-modal';
import { useOptimizationJob } from '@/hooks/use-optimization-job';
import { useDashboardData, usePersistedResult } from '@/hooks/use-dashboard-data';
import { useApiResource } from '@/hooks/use-api-resource';
import { getFlights, type OptimizationResult } from '@/lib/api';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const optimization = useOptimizationJob();

  // Live dashboard data from backend
  const { data: dashboardData, error: dashboardError, loading: dashboardLoading, refetch } = useDashboardData();
  const { data: flights } = useApiResource(getFlights);

  // Persisted optimization result (survives navigation)
  const { result: lastResult, saveResult } = usePersistedResult<OptimizationResult>();

  const totalFlights = dashboardData?.totalFlights ?? 0;
  const totalDisruptions = dashboardData?.totalDisruptions ?? 0;
  const recentFlights = (flights ?? []).slice(0, 5);
  const disruptions = dashboardData?.disruptions || [];

  // Generate flight routes for map
  const activeDisruptions = dashboardData?.disruptions || [];
  const disruptionRoutes: FlightRoute[] = activeDisruptions
    .map((disruption) => ({
        origin: disruption.origin,
        destination: disruption.destination,
        flightNumber: disruption.flight_number,
        status: 'disrupted' as const,
      }))
    .filter((route) => AIRPORTS[route.origin] && AIRPORTS[route.destination]);

  const flightRoutes = disruptionRoutes;

  // Add recovered routes from optimization results
  const recoveredRoutes: FlightRoute[] = lastResult?.reassignments?.slice(0, 10).map((r) => ({
    origin: r.from_location,
    destination: r.to_location,
    flightNumber: r.flight,
    status: 'recovered' as const,
  })).filter((r: FlightRoute) => AIRPORTS[r.origin] && AIRPORTS[r.destination]) || [];

  const allRoutes = [...flightRoutes, ...recoveredRoutes];

  // Start optimization
  const handleOptimize = async () => {
    setIsModalOpen(true);
    await optimization.startOptimization(4);
  };

  const handleRetryOptimization = async () => {
    optimization.reset();
    await optimization.startOptimization(4);
  };

  // Persist result when completed
  useEffect(() => {
    if (optimization.state === 'completed' && optimization.result) {
      saveResult(optimization.result);
    }
  }, [optimization.state, optimization.result, saveResult]);

  if (dashboardLoading && !dashboardData) {
    return <GlassCard><ResourceLoading label="Loading operations data" /></GlassCard>;
  }

  if (dashboardError && !dashboardData) {
    return <GlassCard><ResourceError message={dashboardError} onRetry={() => void refetch()} /></GlassCard>;
  }

  return (
    <div className="space-y-6">
      {/* Hero Section with Map */}
      <div className="relative">
        {/* Map Container */}
        <div className="relative overflow-hidden rounded-2xl border border-slate-300 shadow-xl shadow-slate-900/10">
          <FlightMap routes={allRoutes} height="450px" />

          {/* Overlay Controls - pointer-events-none on container, auto on interactive elements */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute left-4 right-4 top-4 flex flex-col items-start justify-between gap-3 sm:flex-row">
              {/* Title */}
              <div className="pointer-events-auto rounded-xl border border-white/10 bg-slate-950/90 px-5 py-4 shadow-lg backdrop-blur-xl">
                <h1 className="text-xl font-semibold tracking-tight text-white sm:text-2xl">Crew recovery network</h1>
                <p className="text-white/70 text-sm mt-1">Real-time operations • {flightRoutes.length} active routes</p>
              </div>

              {/* Optimize Button - AA Red, professional look */}
              <Button
                onClick={handleOptimize}
                disabled={optimization.state === 'running' || optimization.state === 'submitting'}
                className="pointer-events-auto h-11 rounded-lg bg-blue-700 px-5 font-semibold text-white shadow-md transition-colors hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-70"
              >
                {optimization.state === 'running' || optimization.state === 'submitting' ? (
                  <>
                    <LoaderCircle className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                    Optimizing
                  </>
                ) : (
                  <>
                    <SlidersHorizontal className="mr-2 h-4 w-4" aria-hidden="true" />
                    Optimize Crew
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="flex gap-4 justify-center">
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/85 px-4 py-2 backdrop-blur-xl">
                <div className="h-2 w-2 rounded-full bg-red-500" />
                <span className="text-white/90 text-sm font-medium">{totalDisruptions} Disruptions</span>
              </div>
              <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-950/85 px-4 py-2 backdrop-blur-xl">
                <Plane className="h-4 w-4 text-blue-400" aria-hidden="true" />
                <span className="text-white/90 text-sm font-medium">{totalFlights} Flights</span>
              </div>
              {lastResult && (
                <div className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-slate-950/85 px-4 py-2 backdrop-blur-xl">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" aria-hidden="true" />
                  <span className="text-sm font-medium text-emerald-300">
                    {lastResult.metrics?.flights_recovered || 0} flights recovered
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Latest optimization summary */}
      {lastResult && (
        <GlassCard className="p-0">
          <div className="flex flex-col gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-blue-700">Latest run</p>
              <h2 className="mt-1 text-lg font-semibold text-slate-950">Optimization summary</h2>
            </div>
            <Badge variant="outline" className="w-fit gap-1.5 border-slate-300 text-slate-700">
              <Cpu className="h-3.5 w-3.5" aria-hidden="true" />
              {lastResult.compute_mode === 'cloud' ? 'AWS Lambda' : 'Local process pool'}
            </Badge>
          </div>
          <dl className="grid divide-y divide-slate-200 sm:grid-cols-4 sm:divide-x sm:divide-y-0">
            {[
              ['Scenarios evaluated', lastResult.total_scenarios_evaluated.toLocaleString()],
              ['Parallel workers', lastResult.workers_used.toLocaleString()],
              ['Crew reassigned', (lastResult.metrics?.crew_reassigned ?? 0).toLocaleString()],
              ['Objective score', lastResult.best_score.toLocaleString(undefined, { maximumFractionDigits: 1 })],
            ].map(([label, value]) => (
              <div key={label} className="px-6 py-5">
                <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</dt>
                <dd className="mt-1 text-2xl font-semibold tabular-nums text-slate-950">{value}</dd>
              </div>
            ))}
          </dl>
        </GlassCard>
      )}

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Upcoming Flights */}
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle>Upcoming Flights</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-b border-slate-200 bg-slate-50 hover:bg-slate-50">
                    <TableHead>Flight</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Departure</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recentFlights.map((flight) => (
                    <TableRow key={flight.flight_number} className="border-b border-slate-100 hover:bg-slate-50">
                      <TableCell className="font-mono font-medium text-blue-700">{flight.flight_number}</TableCell>
                      <TableCell className="text-slate-700">
                        {flight.origin} → {flight.destination}
                      </TableCell>
                      <TableCell className="text-slate-700">
                        {flight.scheduled_departure.slice(11, 16) || flight.scheduled_departure.slice(0, 5)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={flight.disruption_type ? 'border-amber-200 bg-amber-50 text-amber-800' : 'border-slate-200 bg-slate-50 text-slate-700'}>
                          {flight.disruption_type ?? 'scheduled'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </GlassCardContent>
        </GlassCard>

        {/* Active Disruptions */}
        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between">
            <GlassCardTitle>Active Disruptions</GlassCardTitle>
            <Badge variant="destructive" className="bg-red-500/20 text-red-700 border-red-400/30">
              {disruptions.length} Active
            </Badge>
          </GlassCardHeader>
          <GlassCardContent>
            {disruptions.length > 0 ? (
              <div className="space-y-3">
                {disruptions.slice(0, 10).map((disruption, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 p-4 hover:bg-white/30 transition-all"
                  >
                    <div className={`mt-1 h-3 w-3 rounded-full ${disruption.type === 'delay' ? 'bg-amber-500' : 'bg-red-500'} shadow-lg`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-800">{disruption.flight_number}</span>
                        <Badge variant="outline" className="text-xs bg-white/30 border-white/40">
                          {disruption.type}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">
                        {disruption.cause} {disruption.delay_minutes ? `(${disruption.delay_minutes} min delay)` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No active disruptions</p>
            )}
          </GlassCardContent>
        </GlassCard>
      </div>

      {/* Optimization Modal */}
      <OptimizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onRetry={handleRetryOptimization}
        state={optimization.state === 'running' || optimization.state === 'submitting' ? 'running' : optimization.state === 'completed' ? 'completed' : optimization.state === 'error' ? 'error' : 'running'}
        progress={optimization.progress}
        elapsedTime={optimization.elapsedTime}
        result={optimization.result}
        error={optimization.error}
        onReset={optimization.reset}
      />
    </div>
  );
}
