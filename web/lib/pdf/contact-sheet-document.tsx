import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer";
import type { GridSettings, ImageAsset } from "@/lib/types/database";
import { gridCapacity } from "@/lib/grid-presets";
import type { PreparedImage } from "@/lib/pdf/prepare-images";
import { sanitizeImageLabel } from "@/lib/pdf/prepare-images";

// Letter landscape in points (72 pt = 1 inch)
const PAGE_W = 792;
const PAGE_H = 612;
const MARGIN = 28;
const HEADER_H = 38;
const FOOTER_H = 22;

export interface ContactSheetDocumentProps {
  projectName: string;
  images: ImageAsset[];
  prepared: Map<string, PreparedImage | null>;
  gridSettings: GridSettings;
  watermark?: boolean;
}

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#fafaf9",
    padding: MARGIN,
    paddingBottom: MARGIN + FOOTER_H,
    fontFamily: "Helvetica",
  },
  header: {
    height: HEADER_H,
    marginBottom: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1c1917",
  },
  subtitle: {
    fontSize: 8,
    color: "#78716c",
    marginTop: 3,
  },
  grid: {
    flex: 1,
  },
  row: {
    flexDirection: "row",
  },
  cell: {
    borderWidth: 0.5,
    borderColor: "#d6d3d1",
    backgroundColor: "#ffffff",
    padding: 3,
  },
  thumbBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fafaf9",
  },
  thumb: {
    objectFit: "contain",
  },
  placeholder: {
    fontSize: 6,
    color: "#a8a29e",
  },
  label: {
    fontSize: 6,
    color: "#57534e",
    marginTop: 2,
    paddingHorizontal: 2,
  },
  footer: {
    position: "absolute",
    bottom: MARGIN,
    left: MARGIN,
    right: MARGIN,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  footerText: {
    fontSize: 7,
    color: "#d6d3d1",
  },
});

function ContactSheetPage({
  projectName,
  pageImages,
  startIndex,
  pageIndex,
  totalPages,
  totalImages,
  gridSettings,
  prepared,
  watermark,
  cellW,
  cellH,
  labelH,
  thumbH,
}: {
  projectName: string;
  pageImages: (ImageAsset | null)[];
  startIndex: number;
  pageIndex: number;
  totalPages: number;
  totalImages: number;
  gridSettings: GridSettings;
  prepared: Map<string, PreparedImage | null>;
  watermark?: boolean;
  cellW: number;
  cellH: number;
  labelH: number;
  thumbH: number;
}) {
  const pageLabel = totalPages > 1 ? ` · page ${pageIndex + 1}/${totalPages}` : "";

  return (
    <Page size="LETTER" orientation="landscape" style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.title}>{projectName}</Text>
        <Text style={styles.subtitle}>
          {gridSettings.rows}×{gridSettings.cols} contact sheet · {totalImages} images
          {pageLabel}
        </Text>
      </View>

      <View style={styles.grid}>
        {Array.from({ length: gridSettings.rows }).map((_, row) => (
          <View key={row} style={[styles.row, { height: cellH }]}>
            {Array.from({ length: gridSettings.cols }).map((_, col) => {
              const slotIndex = row * gridSettings.cols + col;
              const img = pageImages[slotIndex] ?? null;
              const globalIndex = startIndex + slotIndex;
              const prep = img ? prepared.get(img.id) : null;

              return (
                <View
                  key={col}
                  style={[styles.cell, { width: cellW, height: cellH }]}
                >
                  <View style={[styles.thumbBox, { height: thumbH }]}>
                    {img && prep ? (
                      // eslint-disable-next-line jsx-a11y/alt-text -- @react-pdf/renderer Image
                      <Image
                        src={prep.dataUrl}
                        style={[styles.thumb, { maxWidth: cellW - 8, maxHeight: thumbH - 4 }]}
                      />
                    ) : img ? (
                      <Text style={styles.placeholder}>Image unavailable</Text>
                    ) : null}
                  </View>
                  {gridSettings.showLabels && img && (
                    <Text style={[styles.label, { height: labelH }]}>
                      {sanitizeImageLabel(img.title, globalIndex)}
                    </Text>
                  )}
                </View>
              );
            })}
          </View>
        ))}
      </View>

      {watermark && (
        <View style={styles.footer}>
          <Text style={styles.footerText}>Upgrade to Pro for clean exports</Text>
          <Text style={styles.footerText}>InspoGrid AI</Text>
        </View>
      )}
    </Page>
  );
}

export function ContactSheetDocument({
  projectName,
  images,
  prepared,
  gridSettings,
  watermark = true,
}: ContactSheetDocumentProps) {
  const selected = images.filter((img) => img.selected);
  const capacity = gridCapacity(gridSettings);
  const totalPages = Math.max(1, Math.ceil(selected.length / capacity));

  const gridW = PAGE_W - MARGIN * 2;
  const gridH = PAGE_H - MARGIN * 2 - HEADER_H - 8 - FOOTER_H;
  const cellW = gridW / gridSettings.cols;
  const labelH = gridSettings.showLabels ? 14 : 0;
  const cellH = gridH / gridSettings.rows;
  const thumbH = cellH - labelH - 6;

  return (
    <Document title={projectName} author="InspoGrid AI">
      {Array.from({ length: totalPages }).map((_, page) => {
        const slice = selected.slice(page * capacity, (page + 1) * capacity);
        const pageSlots: (ImageAsset | null)[] = Array.from({ length: capacity }, (_, i) =>
          slice[i] ?? null
        );

        return (
          <ContactSheetPage
            key={page}
            projectName={projectName}
            pageImages={pageSlots}
            startIndex={page * capacity}
            pageIndex={page}
            totalPages={totalPages}
            totalImages={selected.length}
            gridSettings={gridSettings}
            prepared={prepared}
            watermark={watermark}
            cellW={cellW}
            cellH={cellH}
            labelH={labelH}
            thumbH={thumbH}
          />
        );
      })}
    </Document>
  );
}