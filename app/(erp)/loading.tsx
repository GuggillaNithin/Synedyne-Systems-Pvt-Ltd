import { TableSkeleton, PageHeaderSkeleton } from "@/components/shared/skeletons";

export default function PageLoading() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      <div className="skeleton h-10 w-full rounded-lg" />
      <TableSkeleton rows={10} cols={6} />
    </div>
  );
}
