'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        <h1 className="text-3xl font-bold text-secondary">Disruptions</h1>
        <p className="text-muted-foreground">Monitor and resolve operational disruptions</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-red-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{severityCounts.critical}</div>
          </CardContent>
        </Card>
        <Card className="border-orange-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">High</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{severityCounts.high}</div>
          </CardContent>
        </Card>
        <Card className="border-yellow-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Medium</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{severityCounts.medium}</div>
          </CardContent>
        </Card>
        <Card className="border-gray-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Low</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{severityCounts.low}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertIcon className="h-5 w-5 text-destructive" />
            Active Disruptions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {activeDisruptions.length > 0 ? (
            <div className="space-y-4">
              {activeDisruptions.map((disruption) => {
                const flight = mockFlights.find((f) => f.id === disruption.flightId);
                return (
                  <div
                    key={disruption.id}
                    className="flex items-start gap-4 rounded-lg border p-4"
                  >
                    <div className={`mt-1 h-3 w-3 rounded-full ${getSeverityColor(disruption.severity)}`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{flight?.flightNumber}</span>
                        <span className="text-muted-foreground">
                          {flight?.origin} - {flight?.destination}
                        </span>
                        <Badge variant="outline" className="ml-2">
                          {disruption.type.replace('_', ' ')}
                        </Badge>
                        <Badge className={`${getSeverityColor(disruption.severity)} text-white`}>
                          {disruption.severity}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">{disruption.description}</p>
                      <p className="text-xs text-muted-foreground">
                        Reported: {new Date(disruption.createdAt).toLocaleString('en-US', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Assign Crew
                      </Button>
                      <Button size="sm">
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
              <p className="text-muted-foreground">No active disruptions</p>
            </div>
          )}
        </CardContent>
      </Card>

      {resolvedDisruptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckIcon className="h-5 w-5 text-green-500" />
              Recently Resolved
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {resolvedDisruptions.map((disruption) => {
                const flight = mockFlights.find((f) => f.id === disruption.flightId);
                return (
                  <div
                    key={disruption.id}
                    className="flex items-start gap-4 rounded-lg border border-green-200 bg-green-50 p-4"
                  >
                    <CheckIcon className="h-5 w-5 text-green-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold">{flight?.flightNumber}</span>
                        <Badge variant="outline">
                          {disruption.type.replace('_', ' ')}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{disruption.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
