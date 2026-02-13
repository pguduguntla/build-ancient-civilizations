"use client";

import { motion } from "motion/react";
import type { GameEvent, Choice } from "@/app/lib/game-state";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { InView } from "@/components/ui/in-view";

type EventDrawerProps = {
  event: GameEvent | null;
  visible: boolean;
  onChoose: (choice: Choice) => void;
  disabled?: boolean;
};

export function EventDrawer({ event, visible, onChoose, disabled }: EventDrawerProps) {
  if (!event) return null;

  return (
    <div
      className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-500 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Diagonal gradient (desktop) */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top right, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 25%, rgba(0,0,0,0.15) 50%, transparent 65%)",
        }}
      />
      {/* Strong bottom gradient on mobile: dark at bottom (under cards), fading to transparent toward top */}
      {visible && (
        <div
          className="absolute inset-0 md:hidden pointer-events-none"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 40%, rgba(0,0,0,0.25) 70%, transparent 100%)",
          }}
        />
      )}

      {/* Content pinned to bottom-left */}
      <div className="absolute bottom-10 left-0 max-w-sm px-5 pb-4 pointer-events-auto">
        {visible && (
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
        )}
      </div>
    </div>
  );
}
