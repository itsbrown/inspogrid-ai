import { pdf } from "@react-pdf/renderer";
import type { GridSettings, ImageAsset } from "@/lib/types/database";
import { ContactSheetDocument } from "@/lib/pdf/contact-sheet-document";
import { prepareImageForPdf } from "@/lib/pdf/prepare-images";

export interface ExportOptions {
  projectName: string;
  images: ImageAsset[];
  gridSettings: GridSettings;
  watermark?: boolean;
}

export async function exportContactSheetPDF(options: ExportOptions): Promise<Blob> {
  const { projectName, images, gridSettings, watermark = true } = options;
  const selected = images.filter((img) => img.selected);

  const prepared = new Map<string, Awaited<ReturnType<typeof prepareImageForPdf>>>();
  await Promise.all(
    selected.map(async (img) => {
      const src = img.preview_url || img.source_url;
      const result = src ? await prepareImageForPdf(src) : null;
      prepared.set(img.id, result);
    })
  );

  return pdf(
    <ContactSheetDocument
      projectName={projectName}
      images={images}
      prepared={prepared}
      gridSettings={gridSettings}
      watermark={watermark}
    />
  ).toBlob();
}

export function downloadPDF(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}