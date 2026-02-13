"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { type Stats, type HistoryEntry, formatYear } from "@/app/lib/game-state";

type StatsBarProps = {
  year: number;
  stats: Stats;
  history: HistoryEntry[];
  onScrub: (entry: HistoryEntry | null) => void;
  /** When true, bar is hidden on mobile (max-md) to avoid conflict with loading overlay */
  hideOnMobileWhenLoading?: boolean;
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

const RESOURCE_LABELS: Record<string, string> = {
  gold: "Gold",
  food: "Food",
  defense: "Defense",
  culture: "Culture",
};

function StatsPill({ year, stats }: { year: number; stats: Stats }) {
  const [hovered, setHovered] = useState(false);

  const resources = [
    { key: "gold", short: "G", value: stats.gold },
    { key: "food", short: "F", value: stats.food },
    { key: "defense", short: "D", value: stats.defense },
    { key: "culture", short: "C", value: stats.culture },
  ];

  return (
    <motion.div
      animate={{ height: hovered ? "auto" : 32 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-md bg-white/[0.07] backdrop-blur-xl border border-white/[0.1] overflow-hidden cursor-default"
    >
      {/* Collapsed row */}
      <div className="inline-flex items-center gap-2.5 px-3 h-8 whitespace-nowrap">
        <span className="text-white/80 text-[13px] font-medium">{formatYear(year)}</span>
        <span className="text-white/20">&middot;</span>
        <span className="text-white/50 text-[13px]">{stats.population.toLocaleString()}</span>
        <span className="text-white/20">&middot;</span>
        {resources.map(({ short, value }) => (
          <div key={short} className="flex items-center gap-1">
            <span className="text-[12px] text-white/25">{short}</span>
            <ResourceDots value={value} />
          </div>
        ))}
      </div>

      {/* Expanded detail */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="px-3 pb-2.5 pt-1 flex flex-col gap-1.5 border-t border-white/[0.06]"
          >
            <div className="flex items-center justify-between gap-6">
              <span className="text-[11px] text-white/30 uppercase tracking-wider">Population</span>
              <span className="text-[13px] text-white/80 font-medium tabular-nums">{stats.population.toLocaleString()}</span>
            </div>
            {resources.map(({ key, value }) => (
              <div key={key} className="flex items-center justify-between gap-6">
                <span className="text-[11px] text-white/30 uppercase tracking-wider">{RESOURCE_LABELS[key]}</span>
                <div className="flex items-center gap-2">
                  <ResourceDots value={value} />
                  <span className="text-[12px] text-white/50 tabular-nums w-4 text-right">{value}</span>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function StatsBar({ year, stats, history, onScrub, hideOnMobileWhenLoading }: StatsBarProps) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const MIN_BARS = 30;
  const filledSteps = history.length + 1;
  const totalBars = Math.max(MIN_BARS, filledSteps);
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

  const getIndexFromEvent = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      const index = Math.floor(x * totalBars);
      return Math.min(index, filledSteps - 1);
    },
    [totalBars, filledSteps]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      setIsDragging(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      handleInteraction(getIndexFromEvent(e));
    },
    [getIndexFromEvent, handleInteraction]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const index = getIndexFromEvent(e);
      if (isDragging) {
        handleInteraction(index);
      } else {
        setHoveredIndex(index);
      }
    },
    [isDragging, getIndexFromEvent, handleInteraction]
  );

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
    onScrub(null);
    setHoveredIndex(null);
  }, [onScrub]);

  const handlePointerLeave = useCallback(() => {
    if (!isDragging) {
      setHoveredIndex(null);
      onScrub(null);
    }
  }, [isDragging, onScrub]);

  return (
    <div className={`absolute bottom-0 left-0 right-0 z-10 px-4 py-3 ${hideOnMobileWhenLoading ? "max-md:hidden" : ""}`}>
      <div className="flex items-end justify-end gap-3">
        {/* Scrubber - left of stats */}
        {hasHistory && (
          <div className="relative flex flex-col items-center">
            {/* Tooltip */}
            <AnimatePresence>
              {hoveredEntry && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 px-3 py-1.5 rounded-lg bg-black/70 backdrop-blur-xl border border-white/[0.1] text-center whitespace-nowrap"
                >
                  <p className="text-[12px] text-white/50">{formatYear(hoveredEntry.year)}</p>
                  <p className="text-[13px] text-white/80 font-medium">{hoveredEntry.eventTitle}</p>
                </motion.div>
              )}
              {hoveredIndex !== null && hoveredIndex >= history.length && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute bottom-full mb-2 px-3 py-1 rounded-lg bg-black/70 backdrop-blur-xl border border-white/[0.1]"
                >
                  <p className="text-[12px] text-white/60">Now</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bar container */}
            <motion.div
              animate={{ height: hoveredIndex !== null ? 48 : 32 }}
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
              className="flex items-center gap-[3px] px-3 rounded-md bg-white/[0.06] backdrop-blur-xl border border-white/[0.08] cursor-pointer touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onPointerLeave={handlePointerLeave}
            >
              {Array.from({ length: totalBars }).map((_, i) => {
                const isFilled = i < filledSteps;
                const isHovered = hoveredIndex === i;
                const isNow = i === history.length;
                const isActive = hoveredIndex !== null ? i <= hoveredIndex : isFilled;
                const distance = hoveredIndex !== null ? Math.abs(i - hoveredIndex) : -1;

                const resting = 16;
                let barHeight: number;
                if (!isFilled) {
                  barHeight = resting;
                } else if (isHovered) {
                  barHeight = 32;
                } else if (distance >= 0 && distance <= 2 && isFilled) {
                  barHeight = 32 - distance * 5;
                } else {
                  barHeight = resting;
                }

                let barOpacity: number;
                if (!isFilled) {
                  barOpacity = 0.08;
                } else if (isHovered) {
                  barOpacity = 1;
                } else if (isNow) {
                  barOpacity = 0.7;
                } else if (isActive) {
                  barOpacity = 0.5;
                } else {
                  barOpacity = 0.15;
                }

                return (
                  <motion.div
                    key={i}
                    animate={{
                      height: barHeight,
                      opacity: barOpacity,
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="w-[3px] rounded-full bg-white"
                    style={{ minHeight: 4 }}
                  />
                );
              })}
            </motion.div>
          </div>
        )}

        {/* Stats pill - bottom right */}
        <StatsPill year={year} stats={stats} />
      </div>
    </div>
  );
}
