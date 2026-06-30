export type Plan = "free" | "pro" | "team";
export type Platform = "pinterest" | "etsy" | "instagram" | "manual";
export type GridPreset = "contact-4x6" | "square-5x5" | "frame-8x10" | "custom";

export interface GridSettings {
  preset: GridPreset;
  rows: number;
  cols: number;
  dpi: number;
  showLabels: boolean;
  showSource: boolean;
}

export interface Profile {
  id: string;
  email: string;
  plan: Plan;
  stripe_customer_id: string | null;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  grid_settings: GridSettings;
  created_at: string;
  updated_at: string;
}

export interface ImageAsset {
  id: string;
  user_id: string;
  project_id: string | null;
  source_url: string | null;
  storage_path: string | null;
  title: string | null;
  description: string | null;
  tags: string[];
  platform: Platform;
  saved_at: string | null;
  selected: boolean;
  sort_order: number;
  created_at: string;
  /** Client-side preview URL (blob or remote) */
  preview_url?: string;
}

export interface ExportJob {
  id: string;
  project_id: string;
  user_id: string;
  status: "pending" | "processing" | "completed" | "failed";
  pdf_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  completed_at: string | null;
}

export const DEFAULT_GRID_SETTINGS: GridSettings = {
  preset: "contact-4x6",
  rows: 4,
  cols: 6,
  dpi: 300,
  showLabels: true,
  showSource: true,
};