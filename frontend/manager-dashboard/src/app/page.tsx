'use client';

import { useState, useEffect } from 'react';
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
import {
  mockDashboardStats,
  mockFlights,
  mockDisruptions,
  getFlightStatusColor,
  getSeverityColor,
} from '@/lib/mock-data';
import { FlightMap, FlightRoute, AIRPORTS } from '@/components/flight-map';
import { OptimizationModal } from '@/components/optimization-modal';
import { useOptimizationJob } from '@/hooks/use-optimization-job';

function PlaneIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z" />
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

function ZapIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  );
}

function CloudIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z" />
    </svg>
  );
}

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastResult, setLastResult] = useState<any>(null);
  const optimization = useOptimizationJob();

  const stats = mockDashboardStats;
  const recentFlights = mockFlights.slice(0, 5);
  const activeDisruptions = mockDisruptions.filter((d) => !d.resolvedAt);

  // Generate flight routes for map
  const flightRoutes: FlightRoute[] = mockFlights
    .filter(f => AIRPORTS[f.origin] && AIRPORTS[f.destination])
    .map(f => ({
      origin: f.origin,
      destination: f.destination,
      flightNumber: f.flightNumber,
      status: f.status === 'delayed' ? 'disrupted' as const : 'normal' as const,
    }));

  // Add recovered routes from optimization results
  const recoveredRoutes: FlightRoute[] = lastResult?.reassignments?.slice(0, 10).map((r: any) => ({
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

  // Update last result when completed
  useEffect(() => {
    if (optimization.state === 'completed' && optimization.result) {
      setLastResult(optimization.result);
    }
  }, [optimization.state, optimization.result]);

  return (
    <div className="space-y-6">
      {/* Hero Section with Map */}
      <div className="relative">
        {/* Map Container */}
        <div className="relative rounded-3xl overflow-hidden border-2 border-white/30 shadow-2xl">
          <FlightMap routes={allRoutes} height="450px" />

          {/* Overlay Controls - pointer-events-none on container, auto on interactive elements */}
          <div className="absolute inset-0 pointer-events-none z-20">
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
              {/* Title */}
              <div className="pointer-events-auto bg-slate-900/90 backdrop-blur-xl rounded-2xl px-6 py-4 border border-white/20 shadow-xl">
                <h1 className="text-2xl font-bold text-white">Crew Recovery Command Center</h1>
                <p className="text-white/70 text-sm mt-1">Real-time operations • {flightRoutes.length} active routes</p>
              </div>

              {/* Optimize Button - AA Red, professional look */}
              <Button
                onClick={handleOptimize}
                disabled={optimization.state === 'running' || optimization.state === 'submitting'}
                className="pointer-events-auto bg-[#C30019] hover:bg-[#a30016] text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg shadow-red-900/40 border border-red-400/30 transition-all duration-200 hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {optimization.state === 'running' || optimization.state === 'submitting' ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Optimizing...
                  </>
                ) : (
                  <>
                    <ZapIcon className="mr-2 h-5 w-5" />
                    Optimize Crew
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Bottom Stats Bar */}
          <div className="absolute bottom-4 left-4 right-4 z-20">
            <div className="flex gap-4 justify-center">
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20 flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                <span className="text-white/90 text-sm font-medium">{stats.activeDisruptions} Disruptions</span>
              </div>
              <div className="bg-slate-900/80 backdrop-blur-xl rounded-xl px-4 py-2 border border-white/20 flex items-center gap-2">
                <PlaneIcon className="h-4 w-4 text-blue-400" />
                <span className="text-white/90 text-sm font-medium">{stats.activeFlights} Active Flights</span>
              </div>
              {lastResult && (
                <div className="bg-green-500/20 backdrop-blur-xl rounded-xl px-4 py-2 border border-green-400/30 flex items-center gap-2">
                  <span className="text-green-400 text-sm font-medium">
                    ✓ {lastResult.metrics?.flights_recovered || 0} Flights Recovered
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* HPC Results Row (shown after optimization) */}
      {lastResult && (
        <div className="grid gap-4 md:grid-cols-4">
          <GlassCard className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-400/30">
            <GlassCardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-cyan-500">
                {lastResult.total_scenarios_evaluated?.toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 mt-1">Scenarios Evaluated</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border-blue-400/30">
            <GlassCardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-blue-500">
                {lastResult.workers_used}
              </div>
              <div className="text-xs text-slate-600 mt-1">Parallel Workers</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-400/30">
            <GlassCardContent className="pt-4 text-center">
              <Badge className={`text-sm px-3 py-1 ${lastResult.compute_mode === 'cloud'
                ? 'bg-purple-500/30 text-purple-700 border-purple-400/50'
                : 'bg-blue-500/30 text-blue-700 border-blue-400/50'
                }`}>
                <CloudIcon className="h-3 w-3 mr-1 inline" />
                {lastResult.compute_mode === 'cloud' ? 'AWS Lambda' : 'Local'}
              </Badge>
              <div className="text-xs text-slate-600 mt-2">Compute Mode</div>
            </GlassCardContent>
          </GlassCard>

          <GlassCard className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-400/30">
            <GlassCardContent className="pt-4 text-center">
              <div className="text-3xl font-bold text-green-500">
                ${(lastResult.metrics?.cost_savings_usd || 0).toLocaleString()}
              </div>
              <div className="text-xs text-slate-600 mt-1">Projected Savings</div>
            </GlassCardContent>
          </GlassCard>
        </div>
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
                        {flight.origin} → {flight.destination}
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

        {/* Active Disruptions */}
        <GlassCard>
          <GlassCardHeader className="flex flex-row items-center justify-between">
            <GlassCardTitle>Active Disruptions</GlassCardTitle>
            <Badge variant="destructive" className="bg-red-500/20 text-red-700 border-red-400/30">
              {activeDisruptions.length} Active
            </Badge>
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

      {/* Optimization Modal */}
      <OptimizationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
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
