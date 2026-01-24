'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
            <Badge className={`${getStatusColor(crew.status)} text-white`}>
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
        <h1 className="text-3xl font-bold text-secondary">Crew Management</h1>
        <p className="text-muted-foreground">View and manage crew members</p>
      </div>

      <div className="grid gap-4 md:grid-cols-5">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statusCounts.available}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On Duty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{statusCounts.on_duty}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On Break</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statusCounts.on_break}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Off Duty</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statusCounts.off_duty}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{statusCounts.on_leave}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <CardTitle>All Crew Members</CardTitle>
            <div className="flex flex-col gap-2 md:flex-row">
              <div className="relative">
                <SearchIcon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search by name or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full md:w-64"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="on_duty">On Duty</SelectItem>
                  <SelectItem value="on_break">On Break</SelectItem>
                  <SelectItem value="off_duty">Off Duty</SelectItem>
                  <SelectItem value="on_leave">On Leave</SelectItem>
                </SelectContent>
              </Select>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full md:w-40">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="pilot">Captain</SelectItem>
                  <SelectItem value="first_officer">First Officer</SelectItem>
                  <SelectItem value="lead_attendant">Lead Attendant</SelectItem>
                  <SelectItem value="flight_attendant">Flight Attendant</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employee ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Base</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Duty Hours</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCrew.map((crew) => (
                <TableRow key={crew.id}>
                  <TableCell className="font-mono">{crew.employeeId}</TableCell>
                  <TableCell className="font-medium">
                    {crew.firstName} {crew.lastName}
                  </TableCell>
                  <TableCell>{getRoleLabel(crew.role)}</TableCell>
                  <TableCell>{crew.base}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(crew.status)} text-white`}>
                      {crew.status.replace('_', ' ')}
                    </Badge>
                  </TableCell>
                  <TableCell>{crew.dutyHoursRemaining}h</TableCell>
                  <TableCell>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
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
          {filteredCrew.length === 0 && (
            <div className="py-8 text-center text-muted-foreground">
              No crew members found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
