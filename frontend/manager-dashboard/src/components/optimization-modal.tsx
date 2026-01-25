'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { GlassCard, GlassCardContent, GlassCardHeader, GlassCardTitle } from '@/components/ui/glass-card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OptimizationResult, Reassignment } from '@/lib/api';

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

// Animated counter component
function AnimatedNumber({ value, duration = 1000 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (value === 0) {
      setDisplayValue(0);
      return;
    }

    const startTime = Date.now();
    const startValue = displayValue;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(startValue + (value - startValue) * eased);

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };

    requestAnimationFrame(animate);
  }, [value, duration]);

  return <span>{displayValue.toLocaleString()}</span>;
}

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
  const handleClose = () => {
    onReset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-slate-900/95 backdrop-blur-xl border border-white/20 text-white">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            {state === 'running' && (
              <>
                <span className="animate-pulse">⚡</span>
                High-Performance Optimization Running
              </>
            )}
            {state === 'completed' && (
              <>
                <span>✅</span>
                Optimization Complete
              </>
            )}
            {state === 'error' && (
              <>
                <span>❌</span>
                Optimization Failed
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-white/70">
            {state === 'running' && 'AI is evaluating thousands of crew assignment scenarios...'}
            {state === 'completed' && 'Found optimal crew assignments using parallel tabu search'}
            {state === 'error' && error}
          </DialogDescription>
        </DialogHeader>

        {/* Running State */}
        {state === 'running' && (
          <div className="space-y-6 py-4">
            {/* Progress bar */}
            <div className="relative h-3 bg-white/10 rounded-full overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full animate-pulse"
                style={{ width: '65%' }}
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-[shimmer_2s_infinite]" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-cyan-400">
                  {progress.workersStarted}
                </div>
                <div className="text-xs text-white/60 mt-1">Workers Active</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-400">
                  {progress.scenariosEvaluated.toLocaleString()}
                </div>
                <div className="text-xs text-white/60 mt-1">Scenarios Evaluated</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-white">
                  {elapsedTime}s
                </div>
                <div className="text-xs text-white/60 mt-1">Elapsed Time</div>
              </div>
              <div className="text-center">
                {progress.computeMode && (
                  <Badge
                    className={`text-sm px-3 py-1 ${progress.computeMode === 'cloud'
                        ? 'bg-purple-500/30 text-purple-300 border-purple-400/50'
                        : 'bg-blue-500/30 text-blue-300 border-blue-400/50'
                      }`}
                  >
                    ☁️ {progress.computeMode === 'cloud' ? 'AWS Lambda' : 'Local'}
                  </Badge>
                )}
                <div className="text-xs text-white/60 mt-2">Compute Mode</div>
              </div>
            </div>

            {/* Message */}
            <div className="text-center text-white/70 animate-pulse">
              {progress.message || 'Initializing workers...'}
            </div>
          </div>
        )}

        {/* Completed State */}
        {state === 'completed' && result && (
          <div className="space-y-6 py-4">
            {/* HPC Metrics */}
            <div className="grid grid-cols-4 gap-4">
              <GlassCard className="bg-white/5 border-white/10">
                <GlassCardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-cyan-400">
                    <AnimatedNumber value={result.total_scenarios_evaluated} />
                  </div>
                  <div className="text-xs text-white/60 mt-1">Scenarios Evaluated</div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard className="bg-white/5 border-white/10">
                <GlassCardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-blue-400">
                    {result.workers_used}
                  </div>
                  <div className="text-xs text-white/60 mt-1">Parallel Workers</div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard className="bg-white/5 border-white/10">
                <GlassCardContent className="pt-4 text-center">
                  <div className="text-3xl font-bold text-white">
                    {elapsedTime}s
                  </div>
                  <div className="text-xs text-white/60 mt-1">Total Time</div>
                </GlassCardContent>
              </GlassCard>

              <GlassCard className="bg-white/5 border-white/10">
                <GlassCardContent className="pt-4 text-center">
                  <Badge
                    className={`text-sm px-3 py-1 ${result.compute_mode === 'cloud'
                        ? 'bg-purple-500/30 text-purple-300 border-purple-400/50'
                        : 'bg-blue-500/30 text-blue-300 border-blue-400/50'
                      }`}
                  >
                    {result.compute_mode === 'cloud' ? '☁️ Cloud' : '💻 Local'}
                  </Badge>
                  <div className="text-xs text-white/60 mt-2">Compute Mode</div>
                </GlassCardContent>
              </GlassCard>
            </div>

            {/* Savings Banner */}
            {result.metrics && (
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-400/30 rounded-xl p-4 text-center">
                <div className="text-4xl font-bold text-green-400">
                  ${(result.metrics.cost_savings_usd || 0).toLocaleString()}
                </div>
                <div className="text-sm text-green-300/80 mt-1">
                  Projected Cost Savings
                </div>
                <div className="text-xs text-white/50 mt-2">
                  {result.metrics.crew_reassigned} crew reassigned • {result.metrics.flights_recovered} flights recovered
                </div>
              </div>
            )}

            {/* Execution Context (if cloud) */}
            {result.execution_context && result.compute_mode === 'cloud' && (
              <div className="text-xs text-white/40 text-center">
                Lambda: {result.execution_context.function_name} •
                Memory: {result.execution_context.memory_limit_mb}MB •
                Remaining: {Math.round(result.execution_context.remaining_time_ms / 1000)}s
              </div>
            )}

            {/* Reassignments Table */}
            {result.reassignments && result.reassignments.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold mb-3 text-white/90">Crew Reassignments</h3>
                <div className="max-h-60 overflow-y-auto rounded-lg border border-white/10">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-white/10 hover:bg-white/5">
                        <TableHead className="text-white/70">Flight</TableHead>
                        <TableHead className="text-white/70">Crew</TableHead>
                        <TableHead className="text-white/70">Role</TableHead>
                        <TableHead className="text-white/70">Route</TableHead>
                        <TableHead className="text-white/70">Reason</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {result.reassignments.slice(0, 10).map((r, idx) => (
                        <TableRow key={idx} className="border-white/10 hover:bg-white/5">
                          <TableCell className="font-mono text-cyan-400">{r.flight}</TableCell>
                          <TableCell className="text-white">{r.crew_name}</TableCell>
                          <TableCell className="text-white/70 capitalize">{r.crew_role}</TableCell>
                          <TableCell className="text-white/70">
                            {r.from_location} → {r.to_location}
                          </TableCell>
                          <TableCell className="text-white/50 text-xs max-w-48 truncate">
                            {r.reason}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {result.reassignments.length > 10 && (
                  <div className="text-center text-white/40 text-xs mt-2">
                    Showing 10 of {result.reassignments.length} reassignments
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-center gap-4 pt-4">
              <Button
                variant="outline"
                className="border-white/20 text-white hover:bg-white/10"
                onClick={handleClose}
              >
                Close
              </Button>
              <Button
                className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white"
              >
                Apply Changes
              </Button>
            </div>
          </div>
        )}

        {/* Error State */}
        {state === 'error' && (
          <div className="py-8 text-center">
            <div className="text-red-400 mb-4">{error}</div>
            <Button
              variant="outline"
              className="border-white/20 text-white hover:bg-white/10"
              onClick={handleClose}
            >
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
