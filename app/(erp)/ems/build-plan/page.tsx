import * as React from "react";
import { emsService } from "@/services/ems.service";
import { formatNumber } from "@/lib/utils";
import { Zap } from "lucide-react";
import { EMSBuildActionButtons } from "./ems-build-action-buttons";

export const revalidate = 0; // Dynamic route

export default async function EMSBuildPlanPage() {
  // Fetch builds
  const { data: builds } = await emsService.getBuildPlan({});
  const rejectionRate = await emsService.getRejectionRate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">EMS PCB Fabrication Build Plan</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Monitor outsourced PCBA manufacturing schedules, evaluate quality rejection metrics, and track good units output.
        </p>
      </div>

      {/* EMS Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Average Quality Rejection Rate</span>
          <span className="text-2xl font-bold text-red-500 mt-1 block">{rejectionRate.toFixed(2)}%</span>
        </div>
        <div className="bg-card border border-border p-5 rounded-xl shadow-xs">
          <span className="text-[10px] text-muted-foreground uppercase font-bold block">Active PCBA Products Mapped</span>
          <span className="text-2xl font-bold text-foreground mt-1 block">PCBA01 - Main Control Board</span>
        </div>
      </div>

      {/* Builds Table */}
      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/10">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
            <Zap size={16} className="text-primary" /> Active Outsourcing Assembly Schedules
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold">
              <tr>
                <th className="px-5 py-3.5">Target Week</th>
                <th className="px-5 py-3.5">PCBA item Description</th>
                <th className="px-5 py-3.5 text-right">Planned Qty</th>
                <th className="px-5 py-3.5 text-right">Actual Built</th>
                <th className="px-5 py-3.5 text-right">Rejected (Yield Loss)</th>
                <th className="px-5 py-3.5 text-right">Good Qty Approved</th>
                <th className="px-5 py-3.5 text-right">Dispatch to Synedyne</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {builds.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-8 text-muted-foreground">
                    No EMS build plans found. Seed database using Excel workbook to view schedules.
                  </td>
                </tr>
              ) : (
                builds.map((build: any) => (
                  <tr key={build.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4 font-bold text-foreground">{build.week}</td>
                    <td className="px-5 py-4 font-semibold text-foreground">{build.pcba}</td>
                    <td className="px-5 py-4 text-right font-semibold">{formatNumber(build.plannedQty)}</td>
                    <td className="px-5 py-4 text-right text-muted-foreground">{formatNumber(build.actualQty)}</td>
                    <td className="px-5 py-4 text-right text-red-500">{formatNumber(build.rejectedQty)}</td>
                    <td className="px-5 py-4 text-right font-bold text-emerald-500">{formatNumber(build.goodQty)}</td>
                    <td className="px-5 py-4 text-right text-muted-foreground">{formatNumber(build.dispatchToSynedyne)}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                        build.status === "COMPLETED" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        build.status === "PLANNED" ? "bg-slate-500/10 border-slate-500/20 text-slate-500" :
                        "bg-blue-500/10 border-blue-500/20 text-blue-500"
                      }`}>
                        {build.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <EMSBuildActionButtons buildId={build.id} plannedQty={build.plannedQty} status={build.status} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
