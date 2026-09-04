'use client';

import {
  CheckCircle2,
  Cloud,
  Cpu,
  Download,
  LoaderCircle,
  RotateCcw,
  TriangleAlert,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { OptimizationResult } from '@/lib/api';

interface OptimizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => void;
  state: 'running' | 'completed' | 'error';
  progress: {
    workersStarted: number;
    workersCompleted: number;
    workersTotal: number;
    scenariosEvaluated: number;
    iterationsCompleted: number;
    bestScore: number | null;
    message: string;
    computeMode: 'cloud' | 'local' | null;
  };
  elapsedTime: number;
  result: OptimizationResult | null;
  error: string | null;
  onReset: () => void;
}

function formatScore(score: number | null | undefined): string {
  return score == null ? '—' : score.toLocaleString(undefined, { maximumFractionDigits: 1 });
}

export function OptimizationModal({
  isOpen,
  onClose,
  onRetry,
  state,
  progress,
  elapsedTime,
  result,
  error,
  onReset,
}: OptimizationModalProps) {
  const workerTotal = Math.max(progress.workersTotal, progress.workersStarted, 1);
  const progressPercent = state === 'completed'
    ? 100
    : Math.round((progress.workersCompleted / workerTotal) * 100);

  const handleClose = () => {
    onReset();
    onClose();
  };

  const exportResult = () => {
    if (!result) return;

    const blob = new Blob([JSON.stringify(result, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `rerouted-optimization-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-h-[85vh] max-w-3xl overflow-y-auto border-slate-200 bg-white p-0 shadow-2xl">
        {state === 'running' && (
          <div className="p-6 sm:p-8">
            <DialogHeader>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
                <LoaderCircle className="h-5 w-5 animate-spin" aria-hidden="true" />
              </div>
              <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
                Optimizing crew assignments
              </DialogTitle>
              <DialogDescription className="text-slate-600">
                Running independent tabu-search workers and comparing feasible schedules.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-8 space-y-7">
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-slate-700">
                    {progress.message || 'Preparing optimization workers'}
                  </span>
                  <span className="tabular-nums text-slate-500">{progressPercent}%</span>
                </div>
                <div
                  className="h-2 overflow-hidden rounded-full bg-slate-200"
                  role="progressbar"
                  aria-label="Optimization progress"
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={progressPercent}
                >
                  {progress.workersCompleted === 0 ? (
                    <div className="h-full w-1/3 animate-[progress-indeterminate_1.4s_ease-in-out_infinite] rounded-full bg-blue-700" />
                  ) : (
                    <div
                      className="h-full rounded-full bg-blue-700 transition-[width] duration-500 ease-out"
                      style={{ width: `${progressPercent}%` }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{progress.workersCompleted} of {workerTotal} workers complete</span>
                  <span className="tabular-nums">{elapsedTime}s elapsed</span>
                </div>
              </div>

              <dl className="grid divide-y divide-slate-200 rounded-xl border border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="px-4 py-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Scenarios</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-950">
                    {progress.scenariosEvaluated.toLocaleString()}
                  </dd>
                </div>
                <div className="px-4 py-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Iterations</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-950">
                    {progress.iterationsCompleted.toLocaleString()}
                  </dd>
                </div>
                <div className="px-4 py-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Best score</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-950">
                    {formatScore(progress.bestScore)}
                  </dd>
                </div>
              </dl>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                {progress.computeMode === 'cloud' ? (
                  <Cloud className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <Cpu className="h-4 w-4" aria-hidden="true" />
                )}
                <span>
                  {progress.computeMode === 'cloud' ? 'AWS Lambda compute' : 'Local process pool'}
                </span>
              </div>
            </div>
          </div>
        )}

        {state === 'completed' && result && (
          <div>
            <div className="border-b border-slate-200 p-6 sm:p-8">
              <DialogHeader>
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" aria-hidden="true" />
                </div>
                <DialogTitle className="text-xl font-semibold tracking-tight text-slate-950">
                  Optimization complete
                </DialogTitle>
                <DialogDescription className="text-slate-600">
                  Compared {result.total_scenarios_evaluated.toLocaleString()} candidate schedules in {elapsedTime} seconds.
                </DialogDescription>
              </DialogHeader>

              <dl className="mt-7 grid divide-y divide-slate-200 rounded-xl border border-slate-200 sm:grid-cols-3 sm:divide-x sm:divide-y-0">
                <div className="px-4 py-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Best score</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{formatScore(result.best_score)}</dd>
                </div>
                <div className="px-4 py-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Workers</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{result.workers_used}</dd>
                </div>
                <div className="px-4 py-4">
                  <dt className="text-xs font-medium uppercase tracking-wide text-slate-500">Reassignments</dt>
                  <dd className="mt-1 text-xl font-semibold tabular-nums text-slate-950">{result.metrics?.crew_reassigned ?? 0}</dd>
                </div>
              </dl>
            </div>

            <div className="space-y-6 p-6 sm:p-8">
              {result.reassignments.length > 0 ? (
                <section aria-labelledby="reassignments-heading">
                  <div className="mb-3 flex items-center justify-between gap-4">
                    <h3 id="reassignments-heading" className="font-medium text-slate-900">Recommended reassignments</h3>
                    <Badge variant="secondary">{result.reassignments.length} changes</Badge>
                  </div>
                  <div className="overflow-hidden rounded-xl border border-slate-200">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-slate-50 hover:bg-slate-50">
                          <TableHead>Flight</TableHead>
                          <TableHead>Crew member</TableHead>
                          <TableHead>Positioning</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.reassignments.slice(0, 6).map((reassignment) => (
                          <TableRow key={`${reassignment.flight}-${reassignment.crew_id}`}>
                            <TableCell className="font-mono font-medium text-blue-700">{reassignment.flight}</TableCell>
                            <TableCell>
                              <div className="font-medium text-slate-900">{reassignment.crew_name}</div>
                              <div className="text-xs text-slate-500">{reassignment.crew_id}</div>
                            </TableCell>
                            <TableCell className="text-slate-600">
                              {reassignment.from_location} → {reassignment.to_location}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {result.reassignments.length > 6 && (
                    <p className="mt-2 text-sm text-slate-500">
                      {result.reassignments.length - 6} additional changes are included in the export.
                    </p>
                  )}
                </section>
              ) : (
                <p className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                  The selected schedule did not require any crew reassignments.
                </p>
              )}

              <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
                <Button variant="outline" onClick={handleClose}>Close</Button>
                <Button onClick={exportResult} className="bg-blue-700 text-white hover:bg-blue-800">
                  <Download className="h-4 w-4" aria-hidden="true" />
                  Export result
                </Button>
              </div>
            </div>
          </div>
        )}

        {state === 'error' && (
          <div className="p-6 sm:p-8">
            <DialogHeader>
              <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-700">
                <TriangleAlert className="h-5 w-5" aria-hidden="true" />
              </div>
              <DialogTitle className="text-xl font-semibold text-slate-950">Optimization failed</DialogTitle>
              <DialogDescription className="text-slate-600">
                {error || 'The optimization job ended unexpectedly.'}
              </DialogDescription>
            </DialogHeader>
            <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={handleClose}>Close</Button>
              <Button onClick={onRetry} className="bg-blue-700 text-white hover:bg-blue-800">
                <RotateCcw className="h-4 w-4" aria-hidden="true" />
                Try again
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
