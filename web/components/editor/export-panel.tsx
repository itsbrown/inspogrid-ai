"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import type { GridSettings, ImageAsset } from "@/lib/types/database";
import { GRID_PRESETS, applyPreset } from "@/lib/grid-presets";
import { listImages } from "@/lib/data/images";
import { downloadPDF, exportContactSheetPDF } from "@/lib/pdf/export-contact-sheet";
import { gridCapacity } from "@/lib/grid-presets";
import { Download, FileImage } from "lucide-react";

interface ExportPanelProps {
  projectId: string;
  projectName: string;
  images: ImageAsset[];
  gridSettings: GridSettings;
  onGridChange: (settings: GridSettings) => void;
  watermark?: boolean;
}

export function ExportPanel({
  projectId,
  projectName,
  images,
  gridSettings,
  onGridChange,
  watermark = true,
}: ExportPanelProps) {
  const [exporting, setExporting] = useState(false);
  const selectedCount = images.filter((i) => i.selected).length;
  const pages = Math.ceil(selectedCount / gridCapacity(gridSettings)) || 1;

  async function handleExport() {
    setExporting(true);
    try {
      // Refresh signed URLs before export (avoids expired Supabase links)
      const freshImages = await listImages(projectId);
      const pdf = await exportContactSheetPDF({
        projectName,
        images: freshImages,
        gridSettings,
        watermark,
      });
      const slug = projectName.toLowerCase().replace(/\s+/g, "-");
      downloadPDF(pdf, `${slug}-contact-sheet.pdf`);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <FileImage className="h-5 w-5 text-rose-600" />
        <h3 className="font-semibold text-stone-900">Export contact sheet</h3>
      </div>

      <label className="mb-2 block text-sm font-medium text-stone-700">Grid template</label>
      <select
        id="grid-template"
        data-testid="grid-template"
        className="mb-4 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm"
        value={gridSettings.preset}
        onChange={(e) => {
          const preset = e.target.value as GridSettings["preset"];
          onGridChange(applyPreset(preset, gridSettings));
        }}
      >
        {GRID_PRESETS.map((p) => (
          <option key={p.id} value={p.id}>
            {p.label}
          </option>
        ))}
      </select>

      <div className="mb-4 space-y-2 text-sm">
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={gridSettings.showLabels}
            onChange={(e) => onGridChange({ ...gridSettings, showLabels: e.target.checked })}
          />
          Show image labels
        </label>
        <label className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={gridSettings.showSource}
            onChange={(e) => onGridChange({ ...gridSettings, showSource: e.target.checked })}
          />
          Show source links
        </label>
      </div>

      <p className="mb-4 text-xs text-stone-500">
        {selectedCount} image{selectedCount !== 1 ? "s" : ""} → {pages} page{pages !== 1 ? "s" : ""}
      </p>

      {watermark && (
        <p className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
          Free plan exports include a small footer watermark. Use JPG/PNG for best results (HEIC not supported).
        </p>
      )}

      <Button
        className="w-full"
        onClick={handleExport}
        disabled={exporting || images.filter((i) => i.selected).length === 0}
        data-testid="generate-pdf-btn"
      >
        <Download className="h-4 w-4" />
        {exporting ? "Generating PDF…" : `Generate PDF (${pages} page${pages !== 1 ? "s" : ""})`}
      </Button>
    </div>
  );
}