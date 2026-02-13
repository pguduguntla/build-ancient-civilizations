"use client";

import { useState, useCallback } from "react";
import { type HistoryEntry, formatYear } from "@/app/lib/game-state";

type HistoryScrubberProps = {
  history: HistoryEntry[];
  onScrub: (entry: HistoryEntry | null) => void;
};

export function HistoryScrubber({ history, onScrub }: HistoryScrubberProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const totalSteps = history.length + 1;

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

  if (history.length === 0) return null;

  const hoveredEntry = hoveredIndex !== null ? history[hoveredIndex] : null;

  return (
    <div className="absolute bottom-10 left-0 right-0 z-10 flex flex-col items-center gap-1.5 px-6">
      {/* Tooltip */}
      {hoveredEntry && (
        <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xl border border-white/[0.08] text-center max-w-xs">
          <p className="text-[11px] text-white/40">{formatYear(hoveredEntry.year)} &middot; Turn {hoveredEntry.turn}</p>
          <p className="text-[12px] text-white/70 font-medium truncate">{hoveredEntry.eventTitle}</p>
          <p className="text-[11px] text-white/40 truncate">{hoveredEntry.choiceLabel}</p>
        </div>
      )}
      {hoveredIndex !== null && hoveredIndex >= history.length && (
        <div className="px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-xl border border-white/[0.08]">
          <p className="text-[11px] text-white/50">Now</p>
        </div>
      )}

      {/* Scrubber track */}
      <div
        className="w-full max-w-md h-6 flex items-center cursor-pointer touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <div className="w-full h-[3px] rounded-full bg-white/[0.08] relative flex items-center">
          {/* Filled portion */}
          <div
            className="absolute left-0 top-0 h-full rounded-full bg-white/20 transition-all duration-100"
            style={{
              width: hoveredIndex !== null
                ? `${((hoveredIndex + 1) / totalSteps) * 100}%`
                : "100%",
            }}
          />

          {/* Dots for each turn */}
          {Array.from({ length: totalSteps }).map((_, i) => {
            const isActive = hoveredIndex !== null ? i <= hoveredIndex : i <= history.length;
            const isCurrent = hoveredIndex === i;
            const isNow = i === history.length;

            return (
              <div
                key={i}
                className="absolute -translate-x-1/2"
                style={{ left: `${((i + 0.5) / totalSteps) * 100}%` }}
              >
                <div
                  className={`rounded-full transition-all duration-150 ${
                    isCurrent
                      ? "w-2.5 h-2.5 bg-white"
                      : isNow
                        ? "w-2 h-2 bg-white/60"
                        : isActive
                          ? "w-1.5 h-1.5 bg-white/40"
                          : "w-1 h-1 bg-white/15"
                  }`}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
