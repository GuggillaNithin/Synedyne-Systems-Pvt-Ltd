import * as React from "react";
import { auditService } from "@/services/audit.service";
import { formatDate } from "@/lib/utils";
import { ClipboardList, User, ShieldAlert } from "lucide-react";

export const revalidate = 0; // Dynamic route

export default async function AuditLogsPage() {
  const { data: logs } = await auditService.getAll({
    page: 1,
    pageSize: 50,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Security Audit Logs</h1>
        <p className="text-xs text-muted-foreground mt-0.5">
          Review system transaction traces, state changes, entity creations, and user actions.
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl shadow-xs overflow-hidden">
        <div className="px-5 py-4 border-b border-border bg-muted/10 flex items-center gap-2">
          <ClipboardList size={16} className="text-primary" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Historical Audit Trail</h3>
        </div>
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/40 border-b border-border text-muted-foreground uppercase font-semibold sticky top-0 bg-card z-10">
              <tr>
                <th className="px-5 py-3">Timestamp</th>
                <th className="px-5 py-3">Operator</th>
                <th className="px-5 py-3">Action</th>
                <th className="px-5 py-3">Entity Type</th>
                <th className="px-5 py-3">Changes Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-muted-foreground">
                    No audit records found. Performing database seeding or submitting a Sales Order generates logs.
                  </td>
                </tr>
              ) : (
                logs.map((log: any) => (
                  <tr key={log.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-5 py-4 text-muted-foreground font-medium">{formatDate(log.createdAt)}</td>
                    <td className="px-5 py-4 font-semibold text-foreground">
                      <div className="flex items-center gap-1.5">
                        <User size={12} className="text-muted-foreground" />
                        {log.user?.name || "System Automated"}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold border ${
                        log.action === "CREATE" || log.action === "IMPORT" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" :
                        log.action === "APPROVE" ? "bg-blue-500/10 border-blue-500/20 text-blue-500" :
                        log.action === "UPDATE" ? "bg-amber-500/10 border-amber-500/20 text-amber-500" :
                        "bg-red-500/10 border-red-500/20 text-red-500"
                      }`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-foreground">{log.entity}</td>
                    <td className="px-5 py-4 font-mono text-[10px] text-muted-foreground max-w-sm truncate">
                      {log.newValue ? JSON.stringify(log.newValue) : "—"}
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
