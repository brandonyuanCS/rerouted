import { LoaderCircle, RefreshCw, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';

export function ResourceLoading({ label }: { label: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center gap-3 text-sm text-slate-600">
      <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
      {label}
    </div>
  );
}

export function ResourceError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex min-h-64 flex-col items-center justify-center text-center">
      <TriangleAlert className="mb-3 h-6 w-6 text-red-700" aria-hidden="true" />
      <p className="font-medium text-slate-900">Data could not be loaded</p>
      <p className="mt-1 max-w-md text-sm text-slate-600">{message}</p>
      <Button variant="outline" className="mt-5" onClick={onRetry}>
        <RefreshCw className="h-4 w-4" aria-hidden="true" />
        Retry
      </Button>
    </div>
  );
}
