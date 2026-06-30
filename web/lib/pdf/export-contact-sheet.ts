import { jsPDF } from "jspdf";
import type { GridSettings, ImageAsset } from "@/lib/types/database";
import { gridCapacity } from "@/lib/grid-presets";

export interface ExportOptions {
  projectName: string;
  images: ImageAsset[];
  gridSettings: GridSettings;
  watermark?: boolean;
}

async function loadImageDataUrl(src: string): Promise<string | null> {
  try {
    const response = await fetch(src);
    const blob = await response.blob();
    return await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}

export async function exportContactSheetPDF(options: ExportOptions): Promise<jsPDF> {
  const { projectName, images, gridSettings, watermark = true } = options;
  const selected = images.filter((img) => img.selected);
  const capacity = gridCapacity(gridSettings);
  const pageImages = selected.slice(0, capacity);

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: "letter",
  });

  const pageW = 11;
  const pageH = 8.5;
  const margin = 0.4;
  const headerH = 0.5;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2 - headerH;
  const cellW = usableW / gridSettings.cols;
  const cellH = usableH / gridSettings.rows;
  const labelH = gridSettings.showLabels ? 0.22 : 0;

  pdf.setFontSize(14);
  pdf.text(projectName, margin, margin + 0.2);
  pdf.setFontSize(9);
  pdf.setTextColor(120);
  pdf.text(
    `${gridSettings.rows}×${gridSettings.cols} contact sheet · ${pageImages.length} images`,
    margin,
    margin + 0.38
  );
  pdf.setTextColor(0);

  for (let i = 0; i < pageImages.length; i++) {
    const img = pageImages[i];
    const row = Math.floor(i / gridSettings.cols);
    const col = i % gridSettings.cols;
    const x = margin + col * cellW;
    const y = margin + headerH + row * cellH;
    const thumbH = cellH - labelH - 0.05;
    const thumbW = cellW - 0.08;

    pdf.setDrawColor(210);
    pdf.rect(x, y, cellW - 0.04, cellH - 0.04);

    const preview = img.preview_url || img.source_url;
    if (preview) {
      const dataUrl = await loadImageDataUrl(preview);
      if (dataUrl) {
        pdf.addImage(dataUrl, "JPEG", x + 0.02, y + 0.02, thumbW, thumbH, undefined, "FAST");
      }
    }

    if (gridSettings.showLabels) {
      pdf.setFontSize(7);
      const label = img.title || `Image ${i + 1}`;
      pdf.text(label.slice(0, 28), x + 0.02, y + cellH - 0.08);
      if (gridSettings.showSource && img.source_url) {
        pdf.setTextColor(100);
        pdf.text("source linked", x + 0.02, y + cellH - 0.02);
        pdf.setTextColor(0);
      }
    }
  }

  if (watermark) {
    pdf.setFontSize(48);
    pdf.setTextColor(220);
    pdf.text("InspoGrid AI", pageW / 2, pageH / 2, {
      align: "center",
      angle: 35,
    });
    pdf.setTextColor(0);
    pdf.setFontSize(8);
    pdf.text("Upgrade to Pro to remove watermark", margin, pageH - 0.2);
  }

  return pdf;
}

export function downloadPDF(pdf: jsPDF, filename: string) {
  pdf.save(filename);
}