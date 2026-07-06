"use client";

import * as React from "react";
import { Download } from "lucide-react";
import { toast } from "sonner";

interface ExportCSVButtonProps {
  data: any[];
  filename: string;
}

export function ExportCSVButton({ data, filename }: ExportCSVButtonProps) {
  const downloadCSV = () => {
    if (data.length === 0) {
      toast.error("No data available to export");
      return;
    }

    try {
      // Get headers from first row keys
      const headers = Object.keys(data[0]);
      const csvRows = [];
      
      // Add header row
      csvRows.push(headers.join(","));

      // Add data rows
      for (const row of data) {
        const values = headers.map((header: any) => {
          const val = row[header];
          // Escape quotes in string value
          const escaped = String(val === null || val === undefined ? "" : val).replace(/"/g, '\\"');
          return `"${escaped}"`;
        });
        csvRows.push(values.join(","));
      }

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`Exported ${filename} successfully!`);
    } catch (e: any) {
      toast.error("Failed to generate CSV export file");
    }
  };

  return (
    <button
      onClick={downloadCSV}
      className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground hover:bg-primary/95 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg shadow-xs cursor-pointer transition-colors"
    >
      <Download size={12} />
      Export CSV
    </button>
  );
}
export default ExportCSVButton;
