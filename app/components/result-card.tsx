"use client";

import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import type { Stats, HistoryEntry } from "@/app/lib/game-state";
import { StatsBar } from "@/app/components/stats-bar";

type ResultCardProps = {
  text: string;
  visible: boolean;
  onContinue: () => void;
  statDeltas?: Partial<Stats>;
  /** Pass to show stats bar inside the mobile drawer */
  statsBarProps?: {
    year: number;
    stats: Stats;
    history: HistoryEntry[];
    onScrub: (entry: HistoryEntry | null) => void;
  };
};

const STAT_LABELS: Record<keyof Stats, string> = {
  population: "Pop",
  gold: "Gold",
  food: "Food",
  defense: "Defense",
  culture: "Culture",
};

function formatDelta(value: number, key: keyof Stats): string {
  if (key === "population") return value >= 0 ? `+${value.toLocaleString()}` : value.toLocaleString();
  return value >= 0 ? `+${value}` : `${value}`;
}

const outcomeContent = (
  text: string,
  statDeltas: Partial<Stats> | undefined,
  onContinue: () => void
) => {
  const hasDeltas = statDeltas && Object.keys(statDeltas).length > 0;
  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0 }}
      >
        <Badge variant="secondary" className="mb-3 bg-white/[0.1] text-white/60 border-0 backdrop-blur-sm text-[13px] font-medium tracking-wide">
          Outcome
        </Badge>
      </motion.div>

      {hasDeltas && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="flex flex-wrap gap-x-3 gap-y-0.5 mb-3 text-[13px]"
        >
          {(Object.entries(statDeltas) as [keyof Stats, number][]).map(([key, value]) =>
            value !== 0 ? (
              <span key={key} className={value > 0 ? "text-emerald-400/90" : "text-red-400/90"}>
                {STAT_LABELS[key]} {formatDelta(value, key)}
              </span>
            ) : null
          )}
        </motion.div>
      )}

      <TextEffect
        preset="fade-in-blur"
        speedReveal={6}
        speedSegment={1.2}
        delay={0.3}
        as="p"
        per="word"
        className="text-white/70 text-[15px] leading-relaxed mb-4"
      >
        {text}
      </TextEffect>

      <motion.div
        initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        transition={{ duration: 0.4, delay: 0.8 }}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={onContinue}
          className="bg-white/[0.07] border border-white/[0.1] text-white/80 text-[14px]
            hover:bg-white/[0.12] hover:border-white/[0.15] hover:text-white
            active:scale-[0.98]"
        >
          Continue
        </Button>
      </motion.div>
    </>
  );
};

export function ResultCard({ text, visible, onContinue, statDeltas, statsBarProps }: ResultCardProps) {
  if (!text) return null;

  return (
    <>
      {/* Desktop: overlay + gradient, content bottom-left (same as event drawer) */}
      <div
        className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-500 md:block hidden ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      >
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.15) 50%, transparent 65%)",
          }}
        />
      </div>
      <div className="absolute bottom-0 left-0 max-w-sm px-4 pb-4 pointer-events-auto z-20 hidden md:block">
        {visible && outcomeContent(text, statDeltas, onContinue)}
      </div>

      {/* Mobile: outcome swipes up as a bottom sheet with stats bar inside */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="outcome-sheet"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            className="absolute inset-x-0 bottom-0 z-20 md:hidden pointer-events-auto rounded-t-2xl overflow-hidden flex flex-col max-h-[85vh]"
            style={{
              background: "linear-gradient(to top, rgba(0,0,0,0.98) 0%, rgba(0,0,0,0.95) 15%, rgba(0,0,0,0.88) 100%)",
              paddingBottom: "env(safe-area-inset-bottom, 0px)",
            }}
          >
            <div className="px-5 pt-4 pb-4 flex-1 min-h-0 overflow-y-auto">
              {outcomeContent(text, statDeltas, onContinue)}
            </div>
            {statsBarProps && (
              <StatsBar
                year={statsBarProps.year}
                stats={statsBarProps.stats}
                history={statsBarProps.history}
                onScrub={statsBarProps.onScrub}
                embedded
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
