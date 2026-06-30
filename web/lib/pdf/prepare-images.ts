export interface PreparedImage {
  dataUrl: string;
  width: number;
  height: number;
}

/** Load any browser-supported image and normalize to JPEG data URL. */
export async function prepareImageForPdf(src: string): Promise<PreparedImage | null> {
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
      ctx.fillStyle = "#fafaf9";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);
      resolve({ dataUrl: canvas.toDataURL("image/jpeg", 0.92), width: w, height: h });
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export function sanitizeImageLabel(title: string | null, index: number): string {
  if (!title) return `Image ${index + 1}`;
  const cleaned = title.replace(/\.[^.]+$/, "").replace(/^PXL_/i, "").trim();
  if (cleaned.length > 28) return `${cleaned.slice(0, 25)}…`;
  return cleaned || `Image ${index + 1}`;
}