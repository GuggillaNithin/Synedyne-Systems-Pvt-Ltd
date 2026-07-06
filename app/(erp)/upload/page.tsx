"use client";

import * as React from "react";
import { Upload, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, FileText } from "lucide-react";
import { uploadExcelAction } from "@/app/actions/upload";
import type { ImportResult } from "@/types";
import { toast } from "sonner";

export default function UploadPage() {
  const [loading, setLoading] = React.useState(false);
  const [dragActive, setDragActive] = React.useState(false);
  const [result, setResult] = React.useState<ImportResult | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith(".xlsx") && !file.name.endsWith(".xls")) {
      setError("Please upload an Excel workbook (.xlsx or .xls)");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const base64 = Buffer.from(arrayBuffer).toString("base64");
        
        toast.info("Parsing and processing Excel workbook...");
        const res = await uploadExcelAction(base64);

        if (res.success && res.data) {
          setResult(res.data);
          toast.success("Workbook seeded successfully!");
        } else {
          setError(res.error || "An error occurred during seeding.");
          toast.error(res.error || "Failed to seed workbook.");
        }
        setLoading(false);
      };
      reader.readAsArrayBuffer(file);
    } catch (err: any) {
      setError(err?.message || "Failed to read file");
      setLoading(false);
      toast.error("Failed to read file.");
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await processFile(e.target.files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Excel Initial Data Import</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Upload your historical ERP seed workbook. This engine validates columns, transforms DTO structures, and runs a rollback-safe database transaction.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Dropzone */}
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-12 text-center transition-all relative overflow-hidden flex flex-col items-center justify-center min-h-[300px] ${
              dragActive ? "border-primary bg-primary/5" : "border-border bg-card"
            }`}
          >
            {loading ? (
              <div className="space-y-4 flex flex-col items-center justify-center">
                <RefreshCw className="h-10 w-10 text-primary animate-spin" />
                <div>
                  <h3 className="text-sm font-semibold">Executing Seeding Engine...</h3>
                  <p className="text-xs text-muted-foreground mt-1">Validating workbook columns & writing to Postgres</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4 flex flex-col items-center justify-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                  <Upload className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold">Drag & Drop Excel File</h3>
                  <p className="text-xs text-muted-foreground mt-1">Or click to browse from your computer</p>
                </div>
                <input
                  type="file"
                  id="excel-file"
                  className="hidden"
                  accept=".xlsx, .xls"
                  onChange={handleFileInput}
                />
                <label
                  htmlFor="excel-file"
                  className="px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/95 text-xs font-semibold rounded-lg shadow-xs cursor-pointer transition-colors"
                >
                  Select File
                </label>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4 flex gap-3 text-destructive">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <div>
                <h4 className="text-xs font-semibold">Import Engine Warning</h4>
                <p className="text-xs mt-1">{error}</p>
              </div>
            </div>
          )}

          {/* Import Summary Result */}
          {result && (
            <div className="bg-card border border-border rounded-xl p-6 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 text-emerald-500 font-semibold text-sm">
                <CheckCircle2 className="h-5 w-5" />
                Seeding Complete: Database transaction committed.
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Total Sheets</span>
                  <span className="text-xl font-bold">{result.sheets.length}</span>
                </div>
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Imported Rows</span>
                  <span className="text-xl font-bold text-emerald-500">{result.importedRows}</span>
                </div>
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Skipped Rows</span>
                  <span className="text-xl font-bold">{result.skippedRows}</span>
                </div>
                <div className="bg-muted/30 border border-border p-3 rounded-lg text-center">
                  <span className="text-[10px] text-muted-foreground uppercase block font-semibold">Status</span>
                  <span className="text-xs font-semibold text-emerald-500 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full inline-block mt-1">SUCCESS</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase">Sheet Seeding Logs</h4>
                <div className="divide-y divide-border border border-border rounded-lg bg-card overflow-hidden">
                  {result.sheets.map((sheet) => (
                    <div key={sheet.sheetName} className="flex justify-between items-center p-3 text-xs">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{sheet.sheetName}</span>
                      </div>
                      <div className="flex items-center gap-4 text-muted-foreground">
                        <span>Total: <b className="text-foreground">{sheet.total}</b></span>
                        <span className="text-emerald-500 font-semibold">Seeded</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Info Panel */}
        <div className="bg-card border border-border rounded-xl p-6 space-y-4 h-fit shadow-xs">
          <h3 className="text-sm font-semibold">System Instructions</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The ERP system uses PostgreSQL as the primary production database. Excel import is designed to seed historical records (Demand, Production logs, dispatch schedules) exactly once.
          </p>
          <div className="space-y-3 pt-2 text-xs">
            <div className="flex gap-2">
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span>Validates workbook sheet names</span>
            </div>
            <div className="flex gap-2">
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span>Verifies correct headers per module</span>
            </div>
            <div className="flex gap-2">
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span>Runs in single isolation transaction</span>
            </div>
            <div className="flex gap-2">
              <ArrowRight className="h-4 w-4 text-primary shrink-0" />
              <span>Rolls back database state in case of data structure errors</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
