"use client";

import { useState, useCallback } from "react";
import { type Stats, type HistoryEntry, formatYear } from "@/app/lib/game-state";

type StatsBarProps = {
  year: number;
  stats: Stats;
  history: HistoryEntry[];
  onScrub: (entry: HistoryEntry | null) => void;
};

function ResourceDots({ value, max = 5 }: { value: number; max?: number }) {
  return (
    <div className="flex gap-[3px]">
      {Array.from({ length: max }).map((_, i) => (
        <div
          key={i}
          className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
            i < value ? "bg-white/80" : "bg-white/15"
          }`}
        />
      ))}
    </div>
  );
}

export function StatsBar({ year, stats, history, onScrub }: StatsBarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalSteps = history.length + 1;
  const hasHistory = history.length > 0;
  const hoveredEntry = hoveredIndex !== null && hoveredIndex < history.length ? history[hoveredIndex] : null;

  const handleInteraction = useCallback(
    (index: number) => {
      if (index >= history.length) {
        onScrub(null);
        setHoveredIndex(null);
      } else {
        onScrub(history[index]);
        setHoveredIndex(index);
      }
    },
    [history, onScrub]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const index = Math.min(Math.floor(x * totalSteps), totalSteps - 1);
      handleInteraction(index);
    },
    [totalSteps, handleInteraction]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (!isDragging) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const index = Math.min(Math.floor(x * totalSteps), totalSteps - 1);
      handleInteraction(index);
    },
    [isDragging, totalSteps, handleInteraction]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    onScrub(null);
    setHoveredIndex(null);
  }, [onScrub]);

  return (
    <div className="absolute bottom-0 left-0 right-0 z-10 px-4 py-3">
      {/* Scrubber tooltip */}
      {hoveredEntry && (
        <div className="flex justify-end mb-1.5">
          <div className="px-3 py-1.5 rounded-lg bg-white/[0.07] backdrop-blur-xl border border-white/[0.1] text-center max-w-xs">
            <p className="text-[13px] text-white/40">{formatYear(hoveredEntry.year)} &middot; Turn {hoveredEntry.turn}</p>
            <p className="text-[14px] text-white/70 font-medium truncate">{hoveredEntry.eventTitle}</p>
            <p className="text-[13px] text-white/40 truncate">{hoveredEntry.choiceLabel}</p>
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        {/* Stats pill - bottom right */}
        <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-md bg-white/[0.07] backdrop-blur-xl border border-white/[0.1]">
          <span className="text-white/80 text-[13px] font-medium">{formatYear(year)}</span>
          <span className="text-white/20">·</span>
          <span className="text-white/50 text-[13px]">{stats.population.toLocaleString()}</span>
          <span className="text-white/20">·</span>
          {[
            { label: "G", value: stats.gold },
            { label: "F", value: stats.food },
            { label: "D", value: stats.defense },
            { label: "C", value: stats.culture },
          ].map(({ label, value }) => (
            <div key={label} className="flex items-center gap-1">
              <span className="text-[12px] text-white/25">{label}</span>
              <ResourceDots value={value} />
            </div>
          ))}
        </div>

        {/* Scrubber */}
        {hasHistory && (
          <div
            className="w-32 h-5 flex items-center cursor-pointer touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <div className="w-full h-[2px] rounded-full bg-white/[0.08] relative flex items-center">
              <div
                className="absolute left-0 top-0 h-full rounded-full bg-white/15 transition-all duration-100"
                style={{
                  width: hoveredIndex !== null
                    ? `${((hoveredIndex + 1) / totalSteps) * 100}%`
                    : "100%",
                }}
              />
              {Array.from({ length: totalSteps }).map((_, i) => {
                const isCurrent = hoveredIndex === i;
                const isNow = i === history.length;
                const isActive = hoveredIndex !== null ? i <= hoveredIndex : i <= history.length;

                return (
                  <div
                    key={i}
                    className="absolute -translate-x-1/2"
                    style={{ left: `${((i + 0.5) / totalSteps) * 100}%` }}
                  >
                    <div
                      className={`rounded-full transition-all duration-150 ${
                        isCurrent
                          ? "w-2 h-2 bg-white"
                          : isNow
                            ? "w-1.5 h-1.5 bg-white/50"
                            : isActive
                              ? "w-1 h-1 bg-white/30"
                              : "w-1 h-1 bg-white/10"
                      }`}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
