import type { ChangeEvent } from "react";

interface BulkSelectionBarProps {
  selectedCount: number;
  visibleCount: number;
  onSelectAllVisible: () => void;
  onUnselectAll: () => void;
  onRemoveSelected: () => void;
  itemLabel?: string;
}

export function BulkSelectionBar({
  selectedCount,
  visibleCount,
  onSelectAllVisible,
  onUnselectAll,
  onRemoveSelected,
  itemLabel = "items",
}: BulkSelectionBarProps) {
  if (visibleCount === 0) return null;

  return (
    <div
      role="region"
      aria-label="Multiple item selection"
      className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#0B0B0B]/10 bg-[#FAFAF8] px-3 py-2.5"
    >
      <span className="text-[12px] font-semibold text-[#0B0B0B]/65" aria-live="polite">
        {selectedCount} {itemLabel} selected
      </span>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={onSelectAllVisible}
          className="min-h-9 rounded-lg border border-[#0B0B0B]/12 bg-white px-3 text-[12px] font-semibold text-[#0B0B0B]/75 hover:bg-[#0B0B0B]/5"
        >
          Select all visible
        </button>
        <button
          type="button"
          onClick={onUnselectAll}
          disabled={selectedCount === 0}
          className="min-h-9 rounded-lg border border-[#0B0B0B]/12 bg-white px-3 text-[12px] font-semibold text-[#0B0B0B]/75 hover:bg-[#0B0B0B]/5 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Unselect all
        </button>
        <button
          type="button"
          onClick={onRemoveSelected}
          disabled={selectedCount === 0}
          className="min-h-9 rounded-lg border border-red-200 bg-white px-3 text-[12px] font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Remove selected
        </button>
      </div>
    </div>
  );
}

interface CollectionSelectionCheckboxProps {
  checked: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function CollectionSelectionCheckbox({
  checked,
  label,
  onChange,
  disabled = false,
}: CollectionSelectionCheckboxProps) {
  return (
    <input
      type="checkbox"
      checked={checked}
      aria-label={label}
      disabled={disabled}
      onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.checked)}
      className="h-4 w-4 shrink-0 cursor-pointer accent-[#1E293B] disabled:cursor-not-allowed"
    />
  );
}