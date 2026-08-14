"use client";

import { useState } from "react";
import {
  Download,
  FileText,
  Loader2,
  CheckCircle2,
  Printer,
  Share2,
} from "lucide-react";

interface ReportExporterProps {
  reportData: {
    title: string;
    verdict: string;
    aiScore: number;
    manipulationScore: number;
    confidence: number;
    summary: string;
    signals: Array<{
      title: string;
      description: string;
      severity: string;
      score: number | null;
    }>;
    sources?: Array<{
      title: string;
      url: string;
    }>;
    timestamp: string;
    filename?: string;
  };
  variant?: "full" | "compact";
}

export default function ReportExporter({
  reportData,
  variant = "full",
}: ReportExporterProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState<"pdf" | "json" | "csv">(
    "pdf"
  );
  const [showOptions, setShowOptions] = useState(false);

  const exportToJSON = () => {
    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trustlens_report_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToCSV = () => {
    const headers = [
      "Field",
      "Value",
    ];
    const rows = [
      ["Title", reportData.title],
      ["Verdict", reportData.verdict],
      ["AI Score", `${Math.round(reportData.aiScore * 100)}%`],
      ["Manipulation Score", `${Math.round(reportData.manipulationScore * 100)}%`],
      ["Confidence", `${Math.round(reportData.confidence * 100)}%`],
      ["Summary", reportData.summary],
      ["Timestamp", reportData.timestamp],
      [""],
      ["Signal", "Severity", "Score"],
      ...reportData.signals.map((s) => [
        s.title,
        s.severity,
        s.score ? `${Math.round(s.score * 100)}%` : "N/A",
      ]),
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `trustlens_report_${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    
    // Simulate PDF generation
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Create a printable HTML content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>TrustLens Report - ${reportData.title}</title>
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1f2937; }
          .header { text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e5e7eb; }
          .logo { font-size: 24px; font-weight: bold; color: #4c6ef5; }
          .verdict { display: inline-block; padding: 8px 16px; border-radius: 8px; font-weight: bold; margin: 10px 0; }
          .verdict-authentic { background: #dcfce7; color: #166534; }
          .verdict-fake { background: #fef2f2; color: #991b1b; }
          .verdict-manipulated { background: #fff7ed; color: #9a3412; }
          .scores { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
          .score-card { padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; text-align: center; }
          .score-value { font-size: 28px; font-weight: bold; }
          .score-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
          .section { margin: 20px 0; }
          .section-title { font-size: 16px; font-weight: 600; color: #374151; margin-bottom: 10px; }
          .signal { padding: 10px; background: #f9fafb; border-radius: 6px; margin-bottom: 8px; }
          .signal-title { font-weight: 500; }
          .signal-severity { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 11px; }
          .severity-high { background: #fef2f2; color: #991b1b; }
          .severity-medium { background: #fff7ed; color: #9a3412; }
          .severity-low { background: #f0fdf4; color: #166534; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="logo">🛡️ TRUSTLENS</div>
          <p>Content Trust Report</p>
          <div class="verdict verdict-${reportData.verdict === 'likely_authentic' ? 'authentic' : reportData.verdict === 'likely_ai_generated' ? 'fake' : 'manipulated'}">
            ${reportData.verdict.replace(/_/g, ' ').toUpperCase()}
          </div>
          <p style="font-size: 12px; color: #6b7280;">${reportData.filename || 'Content Analysis'} • ${new Date(reportData.timestamp).toLocaleString()}</p>
        </div>

        <div class="scores">
          <div class="score-card">
            <div class="score-value" style="color: #3b82f6;">${Math.round(reportData.aiScore * 100)}%</div>
            <div class="score-label">AI Involvement</div>
          </div>
          <div class="score-card">
            <div class="score-value" style="color: #f59e0b;">${Math.round(reportData.manipulationScore * 100)}%</div>
            <div class="score-label">Manipulation</div>
          </div>
          <div class="score-card">
            <div class="score-value" style="color: #22c55e;">${Math.round(reportData.confidence * 100)}%</div>
            <div class="score-label">Confidence</div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Summary</div>
          <p style="font-size: 14px; line-height: 1.6;">${reportData.summary}</p>
        </div>

        <div class="section">
          <div class="section-title">Detection Signals</div>
          ${reportData.signals.map(s => `
            <div class="signal">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span class="signal-title">${s.title}</span>
                <span class="signal-severity severity-${s.severity}">${s.severity}</span>
              </div>
              <p style="font-size: 12px; color: #6b7280; margin-top: 5px;">${s.description}</p>
              ${s.score !== null ? `<div style="margin-top: 5px; font-size: 12px;">Score: ${Math.round(s.score * 100)}%</div>` : ''}
            </div>
          `).join('')}
        </div>

        ${reportData.sources && reportData.sources.length > 0 ? `
          <div class="section">
            <div class="section-title">Sources</div>
            ${reportData.sources.map(s => `
              <p style="font-size: 13px; margin-bottom: 5px;">• ${s.title}: ${s.url}</p>
            `).join('')}
          </div>
        ` : ''}

        <div class="footer">
          <p><strong>Important:</strong> AI-content detection is probabilistic. Results are estimates and should not be treated as absolute proof.</p>
          <p style="margin-top: 10px;">Generated by TRUSTLENS — ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing/PDF
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 500);
    }

    setIsExporting(false);
  };

  const handleExport = async () => {
    switch (exportFormat) {
      case "pdf":
        await exportToPDF();
        break;
      case "json":
        exportToJSON();
        break;
      case "csv":
        exportToCSV();
        break;
    }
  };

  if (variant === "compact") {
    return (
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors disabled:opacity-50"
      >
        {isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <Download className="w-4 h-4" />
        )}
        Export
      </button>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6">
      <h3 className="font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <FileText className="w-4 h-4" />
        Export Report
      </h3>

      {/* Format Selection */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        {[
          { id: "pdf" as const, label: "PDF", icon: FileText, desc: "Print & save" },
          { id: "json" as const, label: "JSON", icon: FileText, desc: "Raw data" },
          { id: "csv" as const, label: "CSV", icon: FileText, desc: "Spreadsheet" },
        ].map((format) => (
          <button
            key={format.id}
            onClick={() => setExportFormat(format.id)}
            className={`p-3 rounded-xl border-2 transition-all ${
              exportFormat === format.id
                ? "border-brand-500 bg-brand-50"
                : "border-slate-200 hover:border-slate-300"
            }`}
          >
            <format.icon
              className={`w-5 h-5 mx-auto mb-1 ${
                exportFormat === format.id
                  ? "text-brand-600"
                  : "text-slate-400"
              }`}
            />
            <div
              className={`text-sm font-medium ${
                exportFormat === format.id
                  ? "text-brand-700"
                  : "text-slate-700"
              }`}
            >
              {format.label}
            </div>
            <div className="text-xs text-slate-500">{format.desc}</div>
          </button>
        ))}
      </div>

      {/* Export Button */}
      <button
        onClick={handleExport}
        disabled={isExporting}
        className="w-full flex items-center justify-center gap-2 bg-brand-600 text-white py-3 px-6 rounded-xl font-semibold hover:bg-brand-700 transition-colors disabled:opacity-50"
      >
        {isExporting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Generating Report...
          </>
        ) : (
          <>
            <Download className="w-5 h-5" />
            Export as {exportFormat.toUpperCase()}
          </>
        )}
      </button>

      {/* Quick Actions */}
      <div className="flex gap-3 mt-4">
        <button
          onClick={() => window.print()}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          <Printer className="w-4 h-4" />
          Print
        </button>
        <button
          onClick={() => {
            if (navigator.share) {
              navigator.share({
                title: reportData.title,
                text: reportData.summary,
              });
            }
          }}
          className="flex-1 flex items-center justify-center gap-2 py-2 px-4 border border-slate-200 rounded-lg text-sm text-slate-600 hover:bg-slate-50"
        >
          <Share2 className="w-4 h-4" />
          Share
        </button>
      </div>
    </div>
  );
}
