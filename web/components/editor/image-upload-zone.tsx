"use client";

import { useCallback, useState } from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function ImageUploadZone({ onFilesSelected, disabled }: ImageUploadZoneProps) {
  const [dragging, setDragging] = useState(false);

  const handleFiles = useCallback(
    (fileList: FileList | null) => {
      if (!fileList?.length) return;
      const images = Array.from(fileList).filter((f) => f.type.startsWith("image/"));
      if (images.length) onFilesSelected(images);
    },
    [onFilesSelected]
  );

  return (
    <label
      data-testid="manual-upload-zone"
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 transition",
        dragging ? "border-rose-400 bg-rose-50" : "border-stone-300 bg-stone-50 hover:border-rose-300",
        disabled && "pointer-events-none opacity-50"
      )}
      onDragOver={(e) => {
        e.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <Upload className="mb-3 h-8 w-8 text-stone-400" />
      <p className="font-medium text-stone-700">Drag & drop images here</p>
      <p className="mt-1 text-sm text-stone-500">JPG, PNG, WebP, GIF · HEIC not supported for PDF export</p>
      <input
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />
    </label>
  );
}