import type { GridPreset, GridSettings } from "@/lib/types/database";

export interface GridPresetConfig {
  id: GridPreset;
  label: string;
  description: string;
  rows: number;
  cols: number;
}

export const GRID_PRESETS: GridPresetConfig[] = [
  {
    id: "contact-4x6",
    label: "4×6 Contact Sheet",
    description: "Classic 24-image grid for standard contact sheets",
    rows: 4,
    cols: 6,
  },
  {
    id: "square-5x5",
    label: "5×5 Square Grid",
    description: "25 square thumbnails for 5×5 frames",
    rows: 5,
    cols: 5,
  },
  {
    id: "frame-8x10",
    label: "8×10 Frame Layout",
    description: "2×4 layout optimized for 8×10 frames",
    rows: 2,
    cols: 4,
  },
  {
    id: "custom",
    label: "Custom Grid",
    description: "Set your own rows and columns",
    rows: 4,
    cols: 6,
  },
];

export function applyPreset(preset: GridPreset, custom?: Partial<GridSettings>): GridSettings {
  const config = GRID_PRESETS.find((p) => p.id === preset) ?? GRID_PRESETS[0];
  return {
    preset,
    rows: custom?.rows ?? config.rows,
    cols: custom?.cols ?? config.cols,
    dpi: custom?.dpi ?? 300,
    showLabels: custom?.showLabels ?? true,
    showSource: custom?.showSource ?? true,
  };
}

export function gridCapacity(settings: GridSettings): number {
  return settings.rows * settings.cols;
}