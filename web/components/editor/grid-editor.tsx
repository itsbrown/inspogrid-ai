"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { GridSettings, ImageAsset } from "@/lib/types/database";
import { gridCapacity } from "@/lib/grid-presets";
import { GripVertical, X } from "lucide-react";

interface GridEditorProps {
  images: ImageAsset[];
  gridSettings: GridSettings;
  onReorder: (orderedIds: string[]) => void;
  onRemove: (id: string) => void;
}

function SortableThumb({
  image,
  index,
  onRemove,
}: {
  image: ImageAsset;
  index: number;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: image.id,
  });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative overflow-hidden rounded-lg border bg-white shadow-sm ${
        isDragging ? "z-10 opacity-80 ring-2 ring-rose-400" : "border-stone-200"
      }`}
      data-testid="project-grid-item"
    >
      <div className="absolute left-1 top-1 z-10 flex gap-1">
        <button
          type="button"
          className="rounded bg-white/90 p-1 text-stone-500 shadow hover:text-stone-800"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </button>
        <button
          type="button"
          className="rounded bg-white/90 p-1 text-stone-500 shadow hover:text-rose-600"
          onClick={() => onRemove(image.id)}
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
      <div className="aspect-square bg-stone-100">
        {image.preview_url || image.source_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image.preview_url || image.source_url || ""}
            alt={image.title || `Image ${index + 1}`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-stone-400">
            No preview
          </div>
        )}
      </div>
      <div className="truncate px-2 py-1 text-xs text-stone-600">
        {image.title || `Image ${index + 1}`}
      </div>
    </div>
  );
}

export function GridEditor({ images, gridSettings, onReorder, onRemove }: GridEditorProps) {
  const selected = images.filter((img) => img.selected);
  const capacity = gridCapacity(gridSettings);
  const gridImages = selected.slice(0, capacity);
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const ids = gridImages.map((img) => img.id);
    const oldIndex = ids.indexOf(String(active.id));
    const newIndex = ids.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;
    onReorder(arrayMove(ids, oldIndex, newIndex));
  }

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-medium text-stone-800">Grid preview</h3>
        <span className="text-sm text-stone-500">
          {gridImages.length} / {capacity} slots
        </span>
      </div>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={gridImages.map((img) => img.id)} strategy={rectSortingStrategy}>
          <div
            data-testid="project-grid"
            className="grid gap-2 rounded-xl border border-stone-200 bg-stone-50 p-3"
            style={{
              gridTemplateColumns: `repeat(${gridSettings.cols}, minmax(0, 1fr))`,
            }}
          >
            {gridImages.map((image, index) => (
              <SortableThumb key={image.id} image={image} index={index} onRemove={onRemove} />
            ))}
            {Array.from({ length: Math.max(0, capacity - gridImages.length) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-stone-300 bg-white text-xs text-stone-400"
              >
                Empty
              </div>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}