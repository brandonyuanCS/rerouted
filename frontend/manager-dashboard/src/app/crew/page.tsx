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
import { mockCrew, getRoleLabel, getStatusColor } from '@/lib/mock-data';
import { CrewMember } from '@/lib/types';

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CrewDetailDialog({ crew }: { crew: CrewMember }) {
  return (
    <DialogContent className="max-w-md">
      <DialogHeader>
        <DialogTitle>
          {crew.firstName} {crew.lastName}
        </DialogTitle>
        <DialogDescription>Employee ID: {crew.employeeId}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Role</p>
            <p className="font-medium">{getRoleLabel(crew.role)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Status</p>
            <Badge className={`${getStatusColor(crew.status)} text-slate-800`}>
              {crew.status.replace('_', ' ')}
            </Badge>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Base</p>
            <p className="font-medium">{crew.base}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Duty Hours Left</p>
            <p className="font-medium">{crew.dutyHoursRemaining}h</p>
          </div>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Contact</p>
          <p className="text-sm">{crew.phone}</p>
          <p className="text-sm">{crew.email}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground mb-2">Certifications</p>
          <div className="flex flex-wrap gap-1">
            {crew.certifications.map((cert) => (
              <Badge key={cert} variant="outline">
                {cert}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </DialogContent>
  );
}

export default function CrewPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const filteredCrew = mockCrew.filter((crew) => {
    const matchesSearch =
      crew.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      crew.employeeId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || crew.status === statusFilter;
    const matchesRole = roleFilter === 'all' || crew.role === roleFilter;
    return matchesSearch && matchesStatus && matchesRole;
  });

  const statusCounts = {
    available: mockCrew.filter((c) => c.status === 'available').length,
    on_duty: mockCrew.filter((c) => c.status === 'on_duty').length,
    on_break: mockCrew.filter((c) => c.status === 'on_break').length,
    off_duty: mockCrew.filter((c) => c.status === 'off_duty').length,
    on_leave: mockCrew.filter((c) => c.status === 'on_leave').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-800">Crew Management</h1>
        <p className="text-slate-600">View and manage crew members</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Available</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.available}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">On Duty</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.on_duty}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">On Break</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.on_break}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">Off Duty</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-gray-600">{statusCounts.off_duty}</div>
          </GlassCardContent>
        </GlassCard>
        <GlassCard>
          <GlassCardHeader className="pb-2">
            <GlassCardTitle className="text-sm font-medium">On Leave</GlassCardTitle>
          </GlassCardHeader>
          <GlassCardContent>
            <div className="text-2xl font-bold text-purple-600">{statusCounts.on_leave}</div>
          </GlassCardContent>
        </GlassCard>
      </div>

      <GlassCard>
        <GlassCardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <GlassCardTitle>All Crew Members</GlassCardTitle>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <Input
                  placeholder="Search by name or ID..."
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
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="on_duty">On Duty</SelectItem>
                  <SelectItem value="on_break">On Break</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-40 liquid-glass-input">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent className="liquid-glass-card border-white/30">
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="pilot">Captain</SelectItem>
                  <SelectItem value="first_officer">First Officer</SelectItem>
                  <SelectItem value="lead_attendant">Lead Attendant</SelectItem>
                  <SelectItem value="flight_attendant">Flight Attendant</SelectItem>
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
                  <TableHead className="text-gray-700">Employee ID</TableHead>
                  <TableHead className="text-gray-700">Name</TableHead>
                  <TableHead className="text-gray-700">Role</TableHead>
                  <TableHead className="text-gray-700">Base</TableHead>
                  <TableHead className="text-gray-700">Status</TableHead>
                  <TableHead className="text-gray-700">Duty Hours</TableHead>
                  <TableHead className="text-gray-700">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCrew.map((crew) => (
                  <TableRow key={crew.id} className="border-b border-white hover:bg-white/20 transition-colors">
                    <TableCell className="font-mono text-gray-800">{crew.employeeId}</TableCell>
                    <TableCell className="font-medium text-gray-800">
                      {crew.firstName} {crew.lastName}
                    </TableCell>
                    <TableCell className="text-gray-700">{getRoleLabel(crew.role)}</TableCell>
                    <TableCell className="text-gray-700">{crew.base}</TableCell>
                    <TableCell>
                      <Badge className={`${getStatusColor(crew.status)} text-slate-800 liquid-glass-badge border-0`}>
                        {crew.status.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-gray-700">{crew.dutyHoursRemaining}h</TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm" className="liquid-glass-button">
                            View
                          </Button>
                        </DialogTrigger>
                        <CrewDetailDialog crew={crew} />
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredCrew.length === 0 && (
            <div className="py-8 text-center text-gray-500">
              No crew members found matching your filters.
            </div>
          )}
        </GlassCardContent>
      </GlassCard>
    </div>
  );
}
