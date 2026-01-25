'use client';

import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockDisruptions, mockFlights, getSeverityColor } from '@/lib/mock-data';

function AlertIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

export default function DisruptionsPage() {
  const activeDisruptions = mockDisruptions.filter((d) => !d.resolvedAt);
  const resolvedDisruptions = mockDisruptions.filter((d) => d.resolvedAt);

  const severityCounts = {
    critical: mockDisruptions.filter((d) => d.severity === 'critical' && !d.resolvedAt).length,
    high: mockDisruptions.filter((d) => d.severity === 'high' && !d.resolvedAt).length,
    medium: mockDisruptions.filter((d) => d.severity === 'medium' && !d.resolvedAt).length,
    low: mockDisruptions.filter((d) => d.severity === 'low' && !d.resolvedAt).length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Disruptions</h1>
        <p className="text-slate-600">Monitor and resolve operational disruptions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <GlassCard className="border-red-200/50">
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Critical</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-red-600">{severityCounts.critical}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard className="border-orange-200/50">
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">High</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-orange-600">{severityCounts.high}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard className="border-yellow-200/50">
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Medium</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-yellow-600">{severityCounts.medium}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Low</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-gray-600">{severityCounts.low}</div>
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <GlassCardHeader>
          <GlassCardTitle className="flex items-center gap-2">
            <AlertIcon className="h-5 w-5 text-red-500" />
            Active Disruptions
          </GlassCardTitle>
        </GlassCardHeader>
        <GlassCardContent>
          {activeDisruptions.length > 0 ? (
            <div className="space-y-4">
              {activeDisruptions.map((disruption) => {
                const flight = mockFlights.find((f) => f.id === disruption.flightId);
                return (
                  <div
                    key={disruption.id}
                    className="flex items-start gap-4 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 p-4 hover:bg-white/30 transition-all"
                  >
                    <div className={`mt-1 h-3 w-3 rounded-full ${getSeverityColor(disruption.severity)} shadow-lg`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">{flight?.flightNumber}</span>
                        <span className="text-gray-600">
                          {flight?.origin} - {flight?.destination}
                        </span>
                        <Badge variant="outline" className="ml-2 bg-white/30 border-white/40">
                          {disruption.type.replace('_', ' ')}
                        </Badge>
                        <Badge className={`${getSeverityColor(disruption.severity)} text-slate-800 liquid-glass-badge border-0`}>
                          {disruption.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{disruption.description}</p>
                      <p className="text-xs text-gray-500">
                        Reported: {new Date(disruption.createdAt).toLocaleString('en-US', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="liquid-glass-button">
                        Assign Crew
                      </Button>
                      <Button size="sm" className="liquid-glass-button bg-[#0078D2] text-slate-800 hover:bg-[#0078D2]/80">
                        Resolve
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-8 text-center">
              <CheckIcon className="h-12 w-12 mx-auto text-green-500 mb-2" />
              <p className="text-gray-500">No active disruptions</p>
            </div>
          )}
        </GlassCardContent>
      </GlassCard>

      {resolvedDisruptions.length > 0 && (
        <GlassCard>
          <GlassCardHeader>
            <GlassCardTitle className="flex items-center gap-2">
              <CheckIcon className="h-5 w-5 text-green-500" />
              Recently Resolved
            </GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="space-y-4">
              {resolvedDisruptions.map((disruption) => {
                const flight = mockFlights.find((f) => f.id === disruption.flightId);
                return (
                  <div
                    key={disruption.id}
                    className="flex items-start gap-4 rounded-2xl bg-green-500/10 backdrop-blur-sm border border-green-300/30 p-4"
                  >
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-gray-800">{flight?.flightNumber}</span>
                        <Badge variant="outline" className="bg-white/30 border-white/40">
                          {disruption.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{disruption.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </GlassCardContent>
        </GlassCard>
      )}
    </div>
  );
}
