import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn('animate-pulse rounded-lg bg-[#E4E9F1]', className)}
      {...props}
    />
  );
}

export function SkeletonKpiCard() {
  return (
    <div className="bg-white border border-[#E4E9F1] rounded-2xl px-5 py-4 flex flex-col gap-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-2 flex-1">
          <div className="flex items-center gap-2">
            <Skeleton className="w-7 h-7 rounded-lg" />
            <Skeleton className="w-24 h-3" />
          </div>
          <Skeleton className="w-32 h-7 mt-1" />
        </div>
        <Skeleton className="w-16 h-7 rounded" />
      </div>
      <Skeleton className="w-28 h-3" />
    </div>
  );
}

export function SkeletonRow({ cols = 5 }) {
  return (
    <tr className="border-b border-[#E4E9F1]">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className={cn('h-4', i === 0 ? 'w-32' : i === cols - 1 ? 'w-16' : 'w-24')} />
        </td>
      ))}
    </tr>
  );
}

export function SkeletonCard({ lines = 3, className }) {
  return (
    <div className={cn('bg-white border border-[#E4E9F1] rounded-2xl p-5 shadow-sm flex flex-col gap-3', className)}>
      <Skeleton className="w-40 h-4" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn('h-3', i === lines - 1 ? 'w-3/4' : 'w-full')} />
      ))}
    </div>
  );
}

export function SkeletonDonut() {
  return (
    <div className="flex gap-6 items-center">
      <Skeleton className="w-36 h-36 rounded-full" />
      <div className="flex flex-col gap-3 flex-1">
        {[100, 80, 65].map((w, i) => (
          <div key={i} className="flex items-center gap-2">
            <Skeleton className="w-3 h-3 rounded-full" />
            <Skeleton className="h-3" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonBars({ count = 6 }) {
  return (
    <div className="flex flex-col gap-3 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-col gap-1.5">
          <div className="flex justify-between">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-3 w-10" />
          </div>
          <Skeleton className="h-2 rounded-full" style={{ width: `${85 - i * 10}%` }} />
        </div>
      ))}
    </div>
  );
}
