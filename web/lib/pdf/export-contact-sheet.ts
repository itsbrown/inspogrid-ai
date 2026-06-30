import { jsPDF } from "jspdf";
import type { GridSettings, ImageAsset } from "@/lib/types/database";
import { gridCapacity } from "@/lib/grid-presets";

export interface ExportOptions {
  projectName: string;
  images: ImageAsset[];
  gridSettings: GridSettings;
  watermark?: boolean;
}

interface PreparedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/** Load any browser-supported image and normalize to JPEG for jsPDF. */
async function prepareImageForPdf(src: string): Promise<PreparedImage | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      const maxDim = 1600;
      let w = img.naturalWidth;
      let h = img.naturalHeight;
      if (!w || !h) {
        resolve(null);
        return;
      }
      if (Math.max(w, h) > maxDim) {
        const scale = maxDim / Math.max(w, h);
        w = Math.round(w * scale);
        h = Math.round(h * scale);
      }
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.fillStyle = "#f5f5f4";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.9), width: w, height: h });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function fitInCell(
  imgW: number,
  imgH: number,
  cellW: number,
  cellH: number,
  padding: number
): { w: number; h: number; x: number; y: number } {
  const maxW = cellW - padding * 2;
  const maxH = cellH - padding * 2;
  const scale = Math.min(maxW / imgW, maxH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return {
    w,
    h,
    x: padding + (maxW - w) / 2,
    y: padding + (maxH - h) / 2,
  };
}

function drawPageHeader(
  pdf: jsPDF,
  projectName: string,
  gridSettings: GridSettings,
  pageIndex: number,
  totalPages: number,
  imageCount: number,
  margin: number
) {
  pdf.setFontSize(13);
  pdf.setTextColor(28, 25, 23);
  pdf.text(projectName, margin, margin + 0.18);

  pdf.setFontSize(8);
  pdf.setTextColor(120, 113, 108);
  const pageLabel = totalPages > 1 ? ` · page ${pageIndex + 1}/${totalPages}` : "";
  pdf.text(
    `${gridSettings.rows}×${gridSettings.cols} contact sheet · ${imageCount} images${pageLabel}`,
    margin,
    margin + 0.36
  );
  pdf.setTextColor(0, 0, 0);
}

function drawWatermark(pdf: jsPDF, pageW: number, pageH: number, margin: number) {
  pdf.setFontSize(9);
  pdf.setTextColor(200, 200, 200);
  pdf.text("InspoGrid AI", pageW - margin, pageH - 0.15, { align: "right" });
  pdf.setFontSize(7);
  pdf.text("Upgrade to Pro for clean exports", margin, pageH - 0.15);
  pdf.setTextColor(0, 0, 0);
}

async function renderGridPage(
  pdf: jsPDF,
  pageImages: ImageAsset[],
  prepared: (PreparedImage | null)[],
  gridSettings: GridSettings,
  layout: {
    margin: number;
    headerH: number;
    pageW: number;
    pageH: number;
    cellW: number;
    cellH: number;
    labelH: number;
  }
) {
  const { margin, headerH, cellW, cellH, labelH } = layout;

  for (let i = 0; i < pageImages.length; i++) {
    const img = pageImages[i];
    const row = Math.floor(i / gridSettings.cols);
    const col = i % gridSettings.cols;
    const x = margin + col * cellW;
    const y = margin + headerH + row * cellH;
    const thumbAreaH = cellH - labelH - 0.04;

    pdf.setDrawColor(214, 211, 209);
    pdf.setFillColor(250, 250, 249);
    pdf.rect(x, y, cellW - 0.02, cellH - 0.02, "FD");

    const prep = prepared[i];
    if (prep) {
      const fit = fitInCell(prep.width, prep.height, cellW - 0.02, thumbAreaH, 0.04);
      pdf.addImage(
        prep.dataUrl,
        "JPEG",
        x + fit.x,
        y + fit.y,
        fit.w,
        fit.h,
        undefined,
        "MEDIUM"
      );
    } else {
      pdf.setFontSize(6);
      pdf.setTextColor(168, 162, 158);
      pdf.text("Image unavailable", x + 0.06, y + thumbAreaH / 2);
      pdf.setTextColor(0, 0, 0);
    }

    if (gridSettings.showLabels) {
      pdf.setFontSize(6);
      pdf.setTextColor(87, 83, 78);
      const label = (img.title || `Image ${i + 1}`).replace(/\.[^.]+$/, "");
      pdf.text(label.slice(0, 32), x + 0.04, y + cellH - 0.06);
      pdf.setTextColor(0, 0, 0);
    }
  }
}

export async function exportContactSheetPDF(options: ExportOptions): Promise<jsPDF> {
  const { projectName, images, gridSettings, watermark = true } = options;
  const selected = images.filter((img) => img.selected);
  const capacity = gridCapacity(gridSettings);
  const totalPages = Math.max(1, Math.ceil(selected.length / capacity));

  const pdf = new jsPDF({
    orientation: "landscape",
    unit: "in",
    format: "letter",
  });

  const pageW = 11;
  const pageH = 8.5;
  const margin = 0.35;
  const headerH = 0.45;
  const usableW = pageW - margin * 2;
  const usableH = pageH - margin * 2 - headerH - 0.2;
  const cellW = usableW / gridSettings.cols;
  const cellH = usableH / gridSettings.rows;
  const labelH = gridSettings.showLabels ? 0.18 : 0;

  const layout = { margin, headerH, pageW, pageH, cellW, cellH, labelH };

  for (let page = 0; page < totalPages; page++) {
    if (page > 0) pdf.addPage("letter", "landscape");

    const pageImages = selected.slice(page * capacity, (page + 1) * capacity);

    drawPageHeader(pdf, projectName, gridSettings, page, totalPages, selected.length, margin);

    const sources = pageImages.map((img) => img.preview_url || img.source_url || "");
    const prepared = await Promise.all(
      sources.map((src) => (src ? prepareImageForPdf(src) : Promise.resolve(null)))
    );

    await renderGridPage(pdf, pageImages, prepared, gridSettings, layout);

    if (watermark) drawWatermark(pdf, pageW, pageH, margin);
  }

  return pdf;
}

export function downloadPDF(pdf: jsPDF, filename: string) {
  pdf.save(filename);
}