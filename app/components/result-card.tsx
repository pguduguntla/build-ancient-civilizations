"use client";

import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import type { Stats } from "@/app/lib/game-state";

type ResultCardProps = {
  text: string;
  visible: boolean;
  onContinue: () => void;
  statDeltas?: Partial<Stats>;
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

export function ResultCard({ text, visible, onContinue, statDeltas }: ResultCardProps) {
  if (!visible || !text) return null;

  const hasDeltas = statDeltas && Object.keys(statDeltas).length > 0;

  return (
    <div className="absolute inset-0 z-20 pointer-events-none">
      {/* Diagonal gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.15) 50%, transparent 65%)",
        }}
      />

      {/* Content pinned to bottom-left */}
      <div className="absolute bottom-10 left-0 max-w-sm px-5 pb-4 pointer-events-auto">
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
      </div>
    </div>
  );
}
