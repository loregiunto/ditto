"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import { CalendarDays, Moon, Sun, Sunset } from "lucide-react";
import type { PublicSlot, PublicSlotDay } from "@/lib/listings/detail";
import styles from "./listing-detail.module.css";

type Props = {
  days: PublicSlotDay[];
  selectedSlotId: string | null;
  onSelect: (slot: PublicSlot) => void;
};

type SlotBand = {
  label: string;
  icon: ReactNode;
  slots: PublicSlot[];
};

function hourFromSlot(slot: PublicSlot): number {
  return Number(slot.startTime.slice(0, 2));
}

function buildBands(slots: PublicSlot[]): SlotBand[] {
  return [
    {
      label: "Mattina",
      icon: <Sun aria-hidden="true" />,
      slots: slots.filter((slot) => hourFromSlot(slot) < 12),
    },
    {
      label: "Pomeriggio",
      icon: <Sunset aria-hidden="true" />,
      slots: slots.filter((slot) => {
        const hour = hourFromSlot(slot);
        return hour >= 12 && hour < 19;
      }),
    },
    {
      label: "Sera",
      icon: <Moon aria-hidden="true" />,
      slots: slots.filter((slot) => hourFromSlot(slot) >= 19),
    },
  ].filter((band) => band.slots.length > 0);
}

export function SlotPicker({ days, selectedSlotId, onSelect }: Props) {
  const firstAvailableIndex = days.findIndex((day) => day.slots.length > 0);
  const [activeIndex, setActiveIndex] = useState(
    firstAvailableIndex >= 0 ? firstAvailableIndex : 0,
  );

  const activeDay = days[activeIndex] ?? days[0];
  const bands = useMemo(
    () => buildBands(activeDay?.slots ?? []),
    [activeDay?.slots],
  );

  return (
    <section className={styles.section} id="slots">
      <div className={styles.slotPicker}>
        <div className={styles.slotPickerHead}>
          <h2>
            Scegli il tuo <em>slot</em>
          </h2>
          <span>Europe/Rome</span>
        </div>

        <div className={styles.dayTabs} aria-label="Giorni disponibili">
          {days.map((day, index) => {
            const isActive = index === activeIndex;
            const isEmpty = day.slots.length === 0;
            return (
              <button
                className={[
                  styles.dayTab,
                  isActive ? styles.activeDayTab : "",
                  day.isToday ? styles.todayTab : "",
                  isEmpty ? styles.disabledDayTab : "",
                ].join(" ")}
                key={day.dateKey}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-pressed={isActive}
              >
                <span className={styles.dow}>{day.dayName}</span>
                <span className={styles.dayNum}>{day.dayNumber}</span>
                <span className={styles.dayStatus}>
                  {day.slots.length > 0 ? `${day.slots.length} slot` : "-"}
                </span>
              </button>
            );
          })}
        </div>

        {activeDay.slots.length === 0 ? (
          <div className={styles.slotEmpty}>
            <div className={styles.emptyIcon}>
              <CalendarDays aria-hidden="true" />
            </div>
            <h3>
              Nessuno slot <em>in questo giorno</em>
            </h3>
            <p>
              L'host non ha pubblicato disponibilita per questa data. Controlla
              gli altri giorni della settimana.
            </p>
          </div>
        ) : (
          bands.map((band) => (
            <div className={styles.slotBand} key={band.label}>
              <div className={styles.slotBandLabel}>
                {band.icon}
                {band.label}
                <span />
              </div>
              <div className={styles.slotGrid}>
                {band.slots.map((slot) => {
                  const selected = slot.id === selectedSlotId;
                  return (
                    <button
                      className={[
                        styles.slot,
                        selected ? styles.selectedSlot : "",
                      ].join(" ")}
                      key={slot.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => onSelect(slot)}
                    >
                      {slot.startTime}
                    </button>
                  );
                })}
              </div>
            </div>
          ))
        )}

        <div className={styles.slotLegend}>
          <span>
            <i className={styles.availableSwatch} /> Disponibile
          </span>
          <span>
            <i className={styles.selectedSwatch} /> Selezionato
          </span>
          <span>
            <i className={styles.bookedSwatch} /> Gia prenotato
          </span>
        </div>
      </div>
    </section>
  );
}
