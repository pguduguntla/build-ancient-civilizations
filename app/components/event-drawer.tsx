"use client";

import { motion, AnimatePresence } from "motion/react";
import type { GameEvent, Choice, Stats, HistoryEntry } from "@/app/lib/game-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { InView } from "@/components/ui/in-view";
import { StatsBar } from "@/app/components/stats-bar";

type EventDrawerProps = {
  event: GameEvent | null;
  visible: boolean;
  onChoose: (choice: Choice) => void;
  disabled?: boolean;
  /** Pass to show stats bar inside the mobile drawer */
  statsBarProps?: {
    year: number;
    stats: Stats;
    history: HistoryEntry[];
    onScrub: (entry: HistoryEntry | null) => void;
  };
};

const eventContent = (
  event: GameEvent,
  onChoose: (choice: Choice) => void,
  disabled?: boolean
) => (
  <>
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0 }}
    >
      <Badge variant="secondary" className="mb-3 bg-white/[0.1] text-white/60 border-0 backdrop-blur-sm text-[13px] font-medium tracking-wide">
        Event
      </Badge>
    </motion.div>

    <TextEffect
      preset="fade-in-blur"
      speedReveal={4}
      speedSegment={0.8}
      delay={0.15}
      as="h2"
      className="text-[17px] font-semibold text-white/95 tracking-tight mb-1.5"
    >
      {event.title}
    </TextEffect>

    <TextEffect
      preset="fade-in-blur"
      speedReveal={6}
      speedSegment={1.2}
      delay={0.3}
      as="p"
      per="word"
      className="text-white/50 text-[15px] leading-relaxed mb-4"
    >
      {event.description}
    </TextEffect>

    <InView
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: 0.2,
            delayChildren: 0.7,
          },
        },
      }}
    >
      <div className="flex flex-col gap-1.5 max-w-[320px]">
        {event.choices.map((choice) => (
          <motion.div
            key={choice.id}
            variants={{
              hidden: { opacity: 0, y: 10 },
              visible: { opacity: 1, y: 0 },
            }}
            style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}
            className="rounded-md"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onChoose(choice)}
              disabled={disabled}
              className="w-full h-auto py-1.5 whitespace-normal text-left justify-start bg-white/[0.07] border border-white/[0.1] text-white/80 text-[14px] !backdrop-blur-none
                hover:bg-white/[0.12] hover:border-white/[0.15] hover:text-white
                active:scale-[0.98]"
            >
              {choice.label}
            </Button>
          </motion.div>
        ))}
      </div>
    </InView>
  </>
);

export function EventDrawer({ event, visible, onChoose, disabled, statsBarProps }: EventDrawerProps) {
  if (!event) return null;

  return (
    <>
      {/* Desktop: same as before – full overlay + gradient, content bottom-left */}
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
        {visible && eventContent(event, onChoose, disabled)}
      </div>

      {/* Mobile: event swipes up as a bottom sheet with stats bar inside */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key="event-sheet"
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
              {eventContent(event, onChoose, disabled)}
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
