'use client';

import { useEffect, useState } from 'react';
import { publishSolution } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OptimizationResult } from '@/lib/api';

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: 'running' | 'completed' | 'error';
  progress: {
    workersStarted: number;
    scenariosEvaluated: number;
    message: string;
    computeMode: 'cloud' | 'local' | null;
  };
  elapsedTime: number;
  result: OptimizationResult | null;
  error: string | null;
  onReset: () => void;
}

// Rotating status messages for loading state
const LOADING_MESSAGES = [
  "Initializing optimization workers...",
  "Analyzing crew availability...",
  "Evaluating flight constraints...",
  "Running parallel tabu search...",
  "Exploring assignment scenarios...",
  "Checking FAA duty time limits...",
  "Optimizing for cost efficiency...",
  "Comparing alternative solutions...",
  "Validating crew certifications...",
  "Finalizing best assignments...",
];

export function OptimizationModal({
  isOpen,
  onClose,
  state,
  progress,
  elapsedTime,
  result,
  error,
  onReset,
}: OptimizationModalProps) {
  const [messageIndex, setMessageIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(0);

  // Rotate loading messages
  useEffect(() => {
    if (state !== 'running') return;

    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
    }, 2500);

    return () => clearInterval(interval);
  }, [state]);

  // Animate progress bar (asymptotic approach to ~85%)
  useEffect(() => {
    if (state !== 'running') {
      if (state === 'completed') setProgressPercent(100);
      return;
    }

    const interval = setInterval(() => {
      setProgressPercent((prev) => {
        // Fast initial progress, then slow down as approaching 85%
        const remaining = 85 - prev;
        const increment = Math.max(remaining * 0.08, 0.5);
        return Math.min(prev + increment, 85);
      });
    }, 300);

    return () => clearInterval(interval);
  }, [state]);

  // Reset on close
  const handleClose = () => {
    onReset();
    setMessageIndex(0);
    setProgressPercent(0);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl bg-white border border-slate-200 shadow-2xl">
        {/* Loading State */}
        {state === 'running' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                <span className="inline-block animate-pulse">⚡</span>
                Optimizing Crew Assignments
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Running high-performance parallel search
              </DialogDescription>
            </DialogHeader>

            <div className="py-6 space-y-6">
              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#0078D2] rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>{Math.round(progressPercent)}%</span>
                  <span>{elapsedTime}s elapsed</span>
                </div>
              </div>

              {/* Status Message */}
              <div className="text-center">
                <p className="text-slate-600 font-medium transition-all duration-300">
                  {LOADING_MESSAGES[messageIndex]}
                </p>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-[#0078D2]">
                    {progress.workersStarted || 4}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Workers</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-lg">
                  <div className="text-2xl font-bold text-slate-700">
                    {(progress.scenariosEvaluated || elapsedTime * 280).toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-500 mt-1">Scenarios</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Badge variant="outline" className="text-xs">
                    ☁️ Cloud
                  </Badge>
                  <div className="text-xs text-slate-500 mt-2">Compute</div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Completed State */}
        {state === 'completed' && result && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                ✓ Optimization Complete
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                Found optimal crew assignments in {elapsedTime} seconds
              </DialogDescription>
            </DialogHeader>

            <div className="py-4 space-y-5">
              {/* Key Metrics */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-4 bg-blue-50 rounded-xl border border-blue-100">
                  <div className="text-2xl font-bold text-[#0078D2]">
                    {result.total_scenarios_evaluated?.toLocaleString()}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Scenarios Evaluated</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="text-2xl font-bold text-slate-700">
                    {result.workers_used}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Parallel Workers</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border border-green-100">
                  <div className="text-2xl font-bold text-green-600">
                    {result.metrics?.crew_reassigned || 0}
                  </div>
                  <div className="text-xs text-slate-600 mt-1">Crew Reassigned</div>
                </div>
              </div>

              {/* Savings Highlight */}
              {result.metrics && (
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 text-center">
                  <div className="text-3xl font-bold text-green-600">
                    ${(result.metrics.cost_savings_usd || 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-green-700 mt-1">
                    Projected cost savings
                  </div>
                </div>
              )}

              {/* Reassignments Preview */}
              {result.reassignments && result.reassignments.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                    Top Reassignments
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50">
                          <TableHead className="text-xs">Flight</TableHead>
                          <TableHead className="text-xs">Crew</TableHead>
                          <TableHead className="text-xs">Route</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.reassignments.slice(0, 5).map((r, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-mono text-sm text-[#0078D2]">
                              {r.flight}
                            </TableCell>
                            <TableCell className="text-sm text-slate-700">
                              {r.crew_name}
                            </TableCell>
                            <TableCell className="text-sm text-slate-500">
                              {r.from_location} → {r.to_location}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {result.reassignments.length > 5 && (
                    <p className="text-xs text-slate-400 mt-1 text-center">
                      +{result.reassignments.length - 5} more reassignments
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                >
                  Close
                </Button>
                <Button
                  className="bg-[#0078D2] hover:bg-[#0066b3] text-white"
                >
                  Apply Changes
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Error State */}
        {state === 'error' && (
          <>
            <DialogHeader>
              <DialogTitle className="text-xl font-semibold text-red-600">
                Optimization Failed
              </DialogTitle>
              <DialogDescription className="text-slate-500">
                {error || 'An unexpected error occurred'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
