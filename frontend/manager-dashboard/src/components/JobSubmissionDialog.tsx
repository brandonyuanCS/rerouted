'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { submitOptimizationJob, getJobStatus } from '@/lib/api';
import { Loader2 } from 'lucide-react';

export function JobSubmissionDialog() {
  const [open, setOpen] = useState(false);
  const [strategy, setStrategy] = useState('fast');
  const [loading, setLoading] = useState(false);
  const [jobStatus, setJobStatus] = useState<any>(null);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const config = strategy === 'hpc'
        ? { num_workers: 8, timeout_seconds: 45, max_iterations: 500, neighborhood_size: 100 }
        : { num_workers: 4, timeout_seconds: 15, max_iterations: 100, neighborhood_size: 20 };

      const res = await submitOptimizationJob(config);

      // Start polling
      pollJob(res.job_id);
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  const pollJob = async (id: string) => {
    const interval = setInterval(async () => {
      try {
        const status = await getJobStatus(id);
        setJobStatus(status);

        if (status.status === 'completed' || status.status === 'failed') {
          clearInterval(interval);
          setLoading(false);
        }
      } catch (e) {
        clearInterval(interval);
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="bg-blue-600 hover:bg-blue-700 font-semibold shadow-lg">
          Launch Optimization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Optimization Configuration</DialogTitle>
          <DialogDescription>
            Configure the Tabu Search parameters and HPC resource allocation.
          </DialogDescription>
        </DialogHeader>

        {!jobStatus ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="strategy" className="text-right">
                Strategy
              </Label>
              <Select value={strategy} onValueChange={setStrategy}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select strategy" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fast">Quick Recovery (4 Workers)</SelectItem>
                  <SelectItem value="hpc">Deep Search (8 Workers - HPC)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        ) : (
          <div className="py-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Status:</span>
              <span className={`capitalize ${jobStatus.status === 'completed' ? 'text-green-600 font-bold' :
                  jobStatus.status === 'running' ? 'text-blue-600 animate-pulse' : 'text-gray-600'
                }`}>
                {jobStatus.status}
              </span>
            </div>

            {jobStatus.result?.metrics && (
              <div className="text-sm space-y-2 bg-slate-50 p-3 rounded">
                <div className="flex justify-between">
                  <span>Score:</span>
                  <span className="font-mono">{jobStatus.result.best_score.toFixed(0)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Moves Evaluated:</span>
                  <span className="font-mono">{jobStatus.result.total_scenarios_evaluated}</span>
                </div>
                <div className="flex justify-between text-green-700 font-bold">
                  <span>Delay Saved:</span>
                  <span>{jobStatus.result.metrics.projected_delay_saved} min</span>
                </div>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {!jobStatus && (
            <Button onClick={handleSubmit} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Submitting...' : 'Start Job'}
            </Button>
          )}
          {jobStatus?.status === 'completed' && (
            <Button className="bg-green-600 hover:bg-green-700" onClick={() => setOpen(false)}>
              Apply Solution
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
