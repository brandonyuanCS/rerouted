'use client';

import { useState } from 'react';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { mockFlights, mockCrew, getFlightStatusColor } from '@/lib/mock-data';
import { Flight } from '@/lib/types';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function FlightDetailDialog({ flight }: { flight: Flight }) {
  const assignedCrew = flight.crewAssignments.map((assignment) => {
    const crew = mockCrew.find((c) => c.id === assignment.crewMemberId);
    return { ...assignment, crew };
  });

  return (
    <DialogContent className="max-w-lg">
      <DialogHeader>
        <DialogTitle>{flight.flightNumber}</DialogTitle>
        <DialogDescription>
          {flight.origin} to {flight.destination}
        </DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className={`${getFlightStatusColor(flight.status)} text-slate-800`}>
              {flight.status.replace('_', ' ')}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Gate</p>
            <p className="font-medium">{flight.gate || 'TBD'}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Scheduled Departure</p>
            <p className="font-medium">
              {new Date(flight.scheduledDeparture).toLocaleString('en-US', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Scheduled Arrival</p>
            <p className="font-medium">
              {new Date(flight.scheduledArrival).toLocaleString('en-US', {
                dateStyle: 'short',
                timeStyle: 'short',
              })}
            </p>
          </div>
          <div className="col-span-2">
            <p className="text-sm text-muted-foreground">Aircraft</p>
            <p className="font-medium">{flight.aircraft}</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Assigned Crew</p>
          {assignedCrew.length > 0 ? (
            <div className="space-y-2">
              {assignedCrew.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="font-medium">
                      {assignment.crew?.firstName} {assignment.crew?.lastName}
                    </p>
                    <p className="text-sm text-muted-foreground">{assignment.role}</p>
                  </div>
                  <Badge
                    variant={assignment.status === 'confirmed' ? 'default' : 'outline'}
                  >
                    {assignment.status}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No crew assigned yet</p>
          )}
        </div>
      </div>
    </DialogContent>
  );
}

export default function FlightsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredFlights = mockFlights.filter((flight) => {
    const matchesSearch =
      flight.flightNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      flight.destination.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || flight.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const statusCounts = {
    scheduled: mockFlights.filter((f) => f.status === 'scheduled').length,
    boarding: mockFlights.filter((f) => f.status === 'boarding').length,
    in_air: mockFlights.filter((f) => f.status === 'in_air').length,
    delayed: mockFlights.filter((f) => f.status === 'delayed').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Flights</h1>
        <p className="text-slate-600">Monitor and manage flight operations</p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Scheduled</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-gray-600">{statusCounts.scheduled}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Boarding</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.boarding}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">In Air</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.in_air}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Delayed</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.delayed}</div>
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <GlassCardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <GlassCardTitle>All Flights</GlassCardTitle>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search flights..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-64 liquid-glass-input"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40 liquid-glass-input">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="liquid-glass-card border-white/30">
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="boarding">Boarding</SelectItem>
                  <SelectItem value="departed">Departed</SelectItem>
                  <SelectItem value="in_air">In Air</SelectItem>
                  <SelectItem value="landed">Landed</SelectItem>
                  <SelectItem value="delayed">Delayed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white hover:bg-white/10">
                  <TableHead className="text-gray-700">Flight</TableHead>
                  <TableHead className="text-gray-700">Route</TableHead>
                  <TableHead className="text-gray-700">Departure</TableHead>
                  <TableHead className="text-gray-700">Arrival</TableHead>
                  <TableHead className="text-gray-700">Gate</TableHead>
                  <TableHead className="text-gray-700">Aircraft</TableHead>
                  <TableHead className="text-gray-700">Status</TableHead>
                  <TableHead className="text-gray-700">Crew</TableHead>
                  <TableHead className="text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredFlights.map((flight) => (
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
                    <TableCell className="text-gray-700">
                      {new Date(flight.scheduledArrival).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-gray-700">{flight.gate || '-'}</TableCell>
                    <TableCell className="text-sm text-gray-700">{flight.aircraft}</TableCell>
                    <TableCell>
                      <Badge className={`${getFlightStatusColor(flight.status)} text-slate-800 liquid-glass-badge border-0`}>
                        {flight.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-white/30 border-white/40 text-gray-700">
                        {flight.crewAssignments.length} assigned
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="liquid-glass-button">
                            Details
                          </Button>
                        </DialogTrigger>
                        <FlightDetailDialog flight={flight} />
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredFlights.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No flights found matching your filters.
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
