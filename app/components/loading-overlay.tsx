"use client";

import { useEffect, useReducer, useCallback } from "react";
import { motion } from "motion/react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import GlareHover from "@/components/GlareHover";

const LOADING_MESSAGES = [
  "Your city evolves",
  "Time passes",
  "The world changes",
  "History unfolds",
  "Your people act on your decision",
];

type State = { index: number; trigger: boolean };
type Action = { type: "cycle_out" } | { type: "cycle_in" } | { type: "reset" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "cycle_out":
      return { ...state, trigger: false };
    case "cycle_in":
      return { index: (state.index + 1) % LOADING_MESSAGES.length, trigger: true };
    case "reset":
      return { index: 0, trigger: true };
    default:
      return state;
  }
}

export function LoadingOverlay({ visible }: { visible: boolean }) {
  const [state, dispatch] = useReducer(reducer, { index: 0, trigger: true });

  const cycleMessage = useCallback(() => {
    dispatch({ type: "cycle_out" });
    setTimeout(() => dispatch({ type: "cycle_in" }), 400);
  }, []);

  useEffect(() => {
    if (!visible) return;
    dispatch({ type: "reset" });
    const interval = setInterval(cycleMessage, 3000);
    return () => clearInterval(interval);
  }, [visible, cycleMessage]);

  if (!visible) return null;

  return (
    <div className="absolute inset-0 z-30 pointer-events-none">
      {/* Glare sweep on loop */}
      <GlareHover
        width="100%"
        height="100%"
        background="transparent"
        borderRadius="0px"
        borderColor="transparent"
        glareColor="#ffffff"
        glareOpacity={0.35}
        glareAngle={-30}
        glareSize={300}
        transitionDuration={2500}
        className="glare-hover--loop"
        style={{ position: "absolute", inset: 0 }}
      >
        <span />
      </GlareHover>

      {/* Edge glow pulsing inward */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.4, 1, 0.4] }}
        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
        style={{
          boxShadow: "inset 0 0 60px 8px rgba(255,255,255,0.4), inset 0 0 120px 20px rgba(200,190,255,0.12)",
        }}
      />

      {/* Diagonal gradient */}
      <div
        className="absolute inset-0"
        style={{
          background: "linear-gradient(to top right, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.4) 25%, rgba(0,0,0,0.1) 50%, transparent 65%)",
        }}
      />

      {/* Content pinned to bottom-left */}
      <div className="absolute bottom-10 left-0 max-w-sm px-5 pb-4 flex items-center gap-3">
        <div className="w-4 h-4 border-[1.5px] border-white/10 border-t-white/60 rounded-full animate-spin shrink-0" />
        <TextEffect
          key={state.index}
          preset="fade-in-blur"
          speedReveal={3}
          speedSegment={0.8}
          trigger={state.trigger}
          per="word"
          as="p"
          className="text-white/50 text-[15px] font-medium"
        >
          {LOADING_MESSAGES[state.index]}
        </TextEffect>
      </div>
    </div>
  );
}
