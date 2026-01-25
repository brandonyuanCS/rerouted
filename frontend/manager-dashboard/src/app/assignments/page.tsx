'use client';

import { useState } from 'react';
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { mockFlights, mockCrew, getRoleLabel } from '@/lib/mock-data';
import { CrewAssignment } from '@/lib/types';

function getAssignmentStatusColor(status: CrewAssignment['status']): string {
  const colors: Record<CrewAssignment['status'], string> = {
    pending: 'bg-yellow-500',
    accepted: 'bg-blue-500',
    declined: 'bg-red-500',
    confirmed: 'bg-green-500',
  };
  return colors[status];
}

function CreateAssignmentDialog() {
  const availableCrew = mockCrew.filter((c) => c.status === 'available');
  const upcomingFlights = mockFlights.filter(
    (f) => f.status === 'scheduled' || f.status === 'boarding'
  );

  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>Create Assignment</DialogTitle>
        <DialogDescription>Assign a crew member to a flight</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div>
          <label className="text-sm font-medium">Select Flight</label>
          <Select>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Choose a flight" />
            </SelectTrigger>
            <SelectContent>
              {upcomingFlights.map((flight) => (
                <SelectItem key={flight.id} value={flight.id}>
                  {flight.flightNumber} - {flight.origin} to {flight.destination}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Select Crew Member</label>
          <Select>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Choose crew member" />
            </SelectTrigger>
            <SelectContent>
              {availableCrew.map((crew) => (
                <SelectItem key={crew.id} value={crew.id}>
                  {crew.firstName} {crew.lastName} - {getRoleLabel(crew.role)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Role on Flight</label>
          <Select>
            <SelectTrigger className="mt-1">
              <SelectValue placeholder="Choose role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="captain">Captain</SelectItem>
              <SelectItem value="first_officer">First Officer</SelectItem>
              <SelectItem value="lead_attendant">Lead Attendant</SelectItem>
              <SelectItem value="flight_attendant">Flight Attendant</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline">Cancel</Button>
        <Button>Send Assignment</Button>
      </DialogFooter>
    </DialogContent>
  );
}

export default function AssignmentsPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const allAssignments = mockFlights.flatMap((flight) =>
    flight.crewAssignments.map((assignment) => ({
      ...assignment,
      flight,
      crew: mockCrew.find((c) => c.id === assignment.crewMemberId),
    }))
  );

  const filteredAssignments = allAssignments.filter((assignment) => {
    return statusFilter === 'all' || assignment.status === statusFilter;
  });

  const statusCounts = {
    pending: allAssignments.filter((a) => a.status === 'pending').length,
    accepted: allAssignments.filter((a) => a.status === 'accepted').length,
    confirmed: allAssignments.filter((a) => a.status === 'confirmed').length,
    declined: allAssignments.filter((a) => a.status === 'declined').length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">Assignments</h1>
          <p className="text-slate-600">Manage crew flight assignments</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="liquid-glass-button bg-[#0078D2] text-slate-800 hover:bg-[#0078D2]/80">Create Assignment</Button>
          </DialogTrigger>
          <CreateAssignmentDialog />
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Pending</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
            <p className="text-xs text-gray-500">Awaiting response</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Accepted</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.accepted}</div>
            <p className="text-xs text-gray-500">Needs confirmation</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Confirmed</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.confirmed}</div>
            <p className="text-xs text-gray-500">Ready for duty</p>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Declined</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-red-600">{statusCounts.declined}</div>
            <p className="text-xs text-gray-500">Needs reassignment</p>
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <GlassCardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <GlassCardTitle>All Assignments</GlassCardTitle>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 liquid-glass-input">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent className="liquid-glass-card border-white/30">
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </GlassCardHeader>
        <GlassCardContent>
          <div className="rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-white hover:bg-white/10">
                  <TableHead className="text-gray-700">Flight</TableHead>
                  <TableHead className="text-gray-700">Route</TableHead>
                  <TableHead className="text-gray-700">Crew Member</TableHead>
                  <TableHead className="text-gray-700">Role</TableHead>
                  <TableHead className="text-gray-700">Assigned</TableHead>
                  <TableHead className="text-gray-700">Status</TableHead>
                  <TableHead className="text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.map((assignment) => (
                  <TableRow key={assignment.id} className="border-b border-white hover:bg-white/20 transition-colors">
                    <TableCell className="font-medium text-gray-800">
                      {assignment.flight.flightNumber}
                    </TableCell>
                    <TableCell className="text-gray-700">
                      {assignment.flight.origin} - {assignment.flight.destination}
                    </TableCell>
                    <TableCell className="text-gray-800">
                      {assignment.crew?.firstName} {assignment.crew?.lastName}
                    </TableCell>
                    <TableCell className="text-gray-700">{assignment.role}</TableCell>
                    <TableCell className="text-gray-700">
                      {new Date(assignment.assignedAt).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge className={`${getAssignmentStatusColor(assignment.status)} text-slate-800 liquid-glass-badge border-0`}>
                        {assignment.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        {assignment.status === 'accepted' && (
                          <Button size="sm" variant="default" className="liquid-glass-button bg-[#0078D2] text-slate-800">
                            Confirm
                          </Button>
                        )}
                        {assignment.status === 'pending' && (
                          <Button size="sm" variant="outline" className="liquid-glass-button">
                            Resend
                          </Button>
                        )}
                        {(assignment.status === 'declined' || assignment.status === 'pending') && (
                          <Button size="sm" variant="destructive" className="liquid-glass-button bg-[#C30019] text-slate-800">
                            Cancel
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredAssignments.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No assignments found matching your filters.
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
