"use client";

import { useCallback, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  compactCellsToRules,
  rulesToCells,
  type WeeklyRule,
} from "@/lib/listings/availability";
import {
  MINUTES_IN_DAY,
  SLOT_GRANULARITY_MIN,
} from "@/lib/validation/availability";

const START_HOUR = 6;
const END_HOUR = 24;
const ROWS = (END_HOUR - START_HOUR) * 2; // 36 rows × 30 min
const ROWS_PER_DAY = MINUTES_IN_DAY / SLOT_GRANULARITY_MIN;
const DAYS = [
  { short: "Lun", long: "Lunedì" },
  { short: "Mar", long: "Martedì" },
  { short: "Mer", long: "Mercoledì" },
  { short: "Gio", long: "Giovedì" },
  { short: "Ven", long: "Venerdì" },
  { short: "Sab", long: "Sabato" },
  { short: "Dom", long: "Domenica" },
];

type Props = {
  listingId: string;
  initialRules: WeeklyRule[];
};

function rowToTime(row: number): string {
  const total = START_HOUR * 60 + row * 30;
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function gridFromRules(rules: WeeklyRule[]): boolean[][] {
  // Use full-day cells from helper (48 rows), then take rows for our visible window
  const fullCells = rulesToCells(rules);
  return fullCells.map((day) =>
    day.slice(START_HOUR * 2, START_HOUR * 2 + ROWS),
  );
}

function rulesFromGrid(grid: boolean[][]): WeeklyRule[] {
  // Pad each row to a full 24h grid (cells before START_HOUR are always false)
  const padded = grid.map((row) => {
    const out = new Array<boolean>(ROWS_PER_DAY).fill(false);
    for (let i = 0; i < row.length; i++) out[START_HOUR * 2 + i] = row[i];
    return out;
  });
  return compactCellsToRules(padded);
}

function gridsEqual(a: boolean[][], b: boolean[][]): boolean {
  for (let d = 0; d < 7; d++) {
    for (let r = 0; r < ROWS; r++) {
      if (a[d][r] !== b[d][r]) return false;
    }
  }
  return true;
}

export function AvailabilityEditor({ listingId, initialRules }: Props) {
  const initialGrid = useMemo(() => gridFromRules(initialRules), [initialRules]);

  const [grid, setGrid] = useState<boolean[][]>(() =>
    initialGrid.map((row) => [...row]),
  );
  const [savedGrid, setSavedGrid] = useState<boolean[][]>(initialGrid);
  const [saving, setSaving] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const paintingRef = useRef<{ mode: "on" | "off" } | null>(null);

  const dirty = useMemo(() => !gridsEqual(grid, savedGrid), [grid, savedGrid]);

  const totalActive = useMemo(
    () => grid.reduce((acc, day) => acc + day.filter(Boolean).length, 0),
    [grid],
  );

  const setCell = useCallback((day: number, row: number, value: boolean) => {
    setGrid((prev) => {
      if (prev[day][row] === value) return prev;
      const next = prev.map((r) => [...r]);
      next[day][row] = value;
      return next;
    });
  }, []);

  function onPointerDown(
    day: number,
    row: number,
    e: React.PointerEvent<HTMLButtonElement>,
  ) {
    e.preventDefault();
    const mode: "on" | "off" = grid[day][row] ? "off" : "on";
    paintingRef.current = { mode };
    setCell(day, row, mode === "on");
    // Capture pointer so move events keep firing even outside the cell
    e.currentTarget.releasePointerCapture?.(e.pointerId);
  }

  function onPointerOverCell(
    day: number,
    row: number,
    e: React.PointerEvent<HTMLButtonElement>,
  ) {
    if (!paintingRef.current) return;
    if (e.pointerType !== "touch" && e.buttons === 0) {
      paintingRef.current = null;
      return;
    }
    setCell(day, row, paintingRef.current.mode === "on");
  }

  function onTouchMoveCell(e: React.TouchEvent<HTMLDivElement>) {
    if (!paintingRef.current) return;
    const touch = e.touches[0];
    if (!touch) return;
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    if (!target) return;
    const cellEl = (target as HTMLElement).closest<HTMLElement>(
      "[data-day][data-row]",
    );
    if (!cellEl) return;
    const d = Number(cellEl.dataset.day);
    const r = Number(cellEl.dataset.row);
    if (Number.isFinite(d) && Number.isFinite(r)) {
      setCell(d, r, paintingRef.current.mode === "on");
    }
  }

  function endPaint() {
    paintingRef.current = null;
  }

  function onCellKeyDown(
    day: number,
    row: number,
    e: React.KeyboardEvent<HTMLButtonElement>,
  ) {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      setCell(day, row, !grid[day][row]);
    }
  }

  function clearAll() {
    setGrid(Array.from({ length: 7 }, () => new Array<boolean>(ROWS).fill(false)));
  }

  function applyPreset(preset: "work" | "evening" | "weekend") {
    const next = Array.from({ length: 7 }, () =>
      new Array<boolean>(ROWS).fill(false),
    );
    if (preset === "work") {
      // Mon–Fri 9–18
      for (let d = 0; d < 5; d++) {
        for (let r = (9 - START_HOUR) * 2; r < (18 - START_HOUR) * 2; r++) {
          next[d][r] = true;
        }
      }
    } else if (preset === "evening") {
      for (let d = 0; d < 7; d++) {
        for (let r = (18 - START_HOUR) * 2; r < (22 - START_HOUR) * 2; r++) {
          next[d][r] = true;
        }
      }
    } else if (preset === "weekend") {
      for (const d of [5, 6]) {
        for (let r = (10 - START_HOUR) * 2; r < (20 - START_HOUR) * 2; r++) {
          next[d][r] = true;
        }
      }
    }
    setGrid(next);
  }

  function reset() {
    setGrid(savedGrid.map((row) => [...row]));
  }

  async function save() {
    setSaving(true);
    try {
      const rules = rulesFromGrid(grid);
      const res = await fetch(`/api/listings/${listingId}/availability`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rules }),
      });
      if (!res.ok) {
        const data = await res
          .json()
          .catch(() => ({}) as { error?: string });
        toast.error(data.error ?? "Impossibile salvare la disponibilità");
        return;
      }
      const data = (await res.json()) as { rules: WeeklyRule[] };
      const newGrid = gridFromRules(data.rules);
      setGrid(newGrid.map((row) => [...row]));
      setSavedGrid(newGrid);
      toast.success("Disponibilità aggiornata");
      startTransition(() => router.refresh());
    } catch {
      toast.error("Errore di rete, riprova");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="flex flex-col gap-6"
      onPointerUp={endPaint}
      onPointerCancel={endPaint}
      onPointerLeave={endPaint}
      onTouchMove={onTouchMoveCell}
    >
      <div className="bg-card flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-xs uppercase tracking-wider">
            Preset rapidi
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset("work")}
          >
            Lun–Ven 9–18
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset("evening")}
          >
            Sera 18–22
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => applyPreset("weekend")}
          >
            Weekend 10–20
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearAll}
            data-testid="availability-clear"
          >
            Svuota
          </Button>
        </div>
        <div className="text-muted-foreground flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5">
            <span className="bg-card inline-block h-3 w-3 rounded-sm border" />
            Chiuso
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border border-emerald-300 bg-emerald-100 dark:border-emerald-800 dark:bg-emerald-900/40" />
            Aperto
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
        <div className="bg-card overflow-hidden rounded-xl border">
          <div
            className="grid select-none"
            style={{ gridTemplateColumns: "64px repeat(7, minmax(0, 1fr))" }}
            data-testid="availability-grid"
          >
            <div className="bg-muted/40 border-b border-r flex h-14 items-center justify-center text-xs font-mono text-muted-foreground">
              h
            </div>
            {DAYS.map((d, i) => {
              const open = grid[i].filter(Boolean).length;
              const hours = (open * 0.5).toString().replace(".", ",");
              return (
                <div
                  key={d.short}
                  className="border-b border-r last:border-r-0 flex h-14 flex-col items-center justify-center gap-0.5 bg-muted/40"
                >
                  <div className="text-base font-medium tracking-tight">
                    {d.short}
                  </div>
                  <div
                    className={`text-xs font-mono ${
                      open > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                    }`}
                  >
                    {open === 0 ? "chiuso" : `${hours} h`}
                  </div>
                </div>
              );
            })}

            {Array.from({ length: ROWS }).map((_, r) => {
              const isHour = r % 2 === 0;
              return (
                <div key={`row-${r}`} className="contents">
                  <div
                    className={`flex h-7 items-start justify-end border-r pr-2 pt-0.5 text-[10.5px] font-mono ${
                      isHour
                        ? "border-b text-muted-foreground"
                        : "border-b border-dashed border-border/60 text-transparent"
                    }`}
                  >
                    {isHour ? rowToTime(r) : ""}
                  </div>
                  {DAYS.map((_, d) => {
                    const active = grid[d][r];
                    return (
                      <button
                        type="button"
                        key={`c-${d}-${r}`}
                        data-testid={`av-cell-${d}-${r}`}
                        data-day={d}
                        data-row={r}
                        data-active={active ? "1" : "0"}
                        aria-pressed={active}
                        aria-label={`${DAYS[d].long} ${rowToTime(r)} ${active ? "aperto" : "chiuso"}`}
                        onPointerDown={(e) => onPointerDown(d, r, e)}
                        onPointerOver={(e) => onPointerOverCell(d, r, e)}
                        onKeyDown={(e) => onCellKeyDown(d, r, e)}
                        className={`h-7 touch-none border-r last:border-r-0 ${
                          isHour
                            ? "border-b"
                            : "border-b border-dashed border-border/60"
                        } cursor-pointer transition-colors ${
                          active
                            ? "bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-900/40 dark:hover:bg-emerald-900/60"
                            : "hover:bg-muted"
                        }`}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <aside className="flex flex-col gap-4 self-start lg:sticky lg:top-6">
          <div className="bg-card rounded-xl border p-5">
            <h3 className="mb-3 text-base font-semibold tracking-tight">
              Riepilogo settimanale
            </h3>
            <div className="flex items-baseline justify-between text-sm">
              <span className="text-muted-foreground">Ore aperte</span>
              <span className="text-2xl font-semibold tracking-tight">
                {(totalActive * 0.5).toString().replace(".", ",")}
              </span>
            </div>
            <div className="bg-muted mt-3 h-2 overflow-hidden rounded-full">
              <span
                className="block h-full bg-emerald-500"
                style={{
                  width: `${Math.min(
                    100,
                    Math.round((totalActive / (7 * ROWS)) * 100),
                  )}%`,
                }}
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Slot da 30 min</span>
              <strong className="font-mono text-sm" data-testid="slots-count">
                {totalActive}
              </strong>
            </div>
          </div>
        </aside>
      </div>

      <div className="bg-background/85 sticky bottom-0 -mx-6 flex items-center justify-between gap-3 border-t px-6 py-3 backdrop-blur md:-mx-10 md:px-10">
        <span className="text-muted-foreground text-sm">
          {dirty ? "Modifiche non salvate" : "Tutte le modifiche salvate"}
        </span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={reset}
            disabled={!dirty || saving}
          >
            Annulla
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={save}
            disabled={saving}
            data-testid="availability-save"
          >
            {saving ? "Salvataggio…" : "Salva modifiche"}
          </Button>
        </div>
      </div>
    </div>
  );
}
