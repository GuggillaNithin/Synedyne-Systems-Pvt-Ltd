// Loading skeleton components for ERP pages

export function TableSkeleton({ rows = 8, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
      <div className="h-[52px] bg-muted/30 border-b border-border px-5 flex items-center gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="skeleton h-3 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, rowIdx) => (
          <div key={rowIdx} className="px-5 py-4 flex items-center gap-4">
            {Array.from({ length: cols }).map((_, colIdx) => (
              <div
                key={colIdx}
                className="skeleton h-3 rounded"
                style={{ flex: colIdx === 1 ? 2 : 1 }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function KPISkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="bg-card border border-border p-5 rounded-xl flex items-center justify-between">
          <div className="space-y-2 flex-1">
            <div className="skeleton h-2.5 w-20 rounded" />
            <div className="skeleton h-7 w-16 rounded" />
            <div className="skeleton h-2 w-28 rounded" />
          </div>
          <div className="skeleton h-10 w-10 rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ className = "" }: { className?: string }) {
  return (
    <div className={`bg-card border border-border rounded-xl p-5 ${className}`}>
      <div className="space-y-3">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-3 w-48 rounded" />
        <div className="skeleton h-3 w-40 rounded" />
      </div>
    </div>
  );
}

export function PageHeaderSkeleton() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div className="space-y-2">
        <div className="skeleton h-7 w-48 rounded" />
        <div className="skeleton h-3 w-72 rounded" />
      </div>
      <div className="skeleton h-9 w-32 rounded-lg" />
    </div>
  );
}
