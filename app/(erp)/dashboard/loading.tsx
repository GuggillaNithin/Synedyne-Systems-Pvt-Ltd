import { TableSkeleton, KPISkeleton, PageHeaderSkeleton } from "@/components/shared/skeletons";

export default function DashboardLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <KPISkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i: any) => (
          <div key={i} className="bg-card border border-border rounded-xl h-[360px] p-5">
            <div className="skeleton h-4 w-32 rounded mb-2" />
            <div className="skeleton h-3 w-48 rounded mb-4" />
            <div className="skeleton h-48 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TableSkeleton rows={4} cols={4} />
        <TableSkeleton rows={4} cols={4} />
      </div>
    </div>
  );
}
