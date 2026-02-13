"use client";

import { useEffect, useReducer, useCallback } from "react";
import { motion } from "motion/react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import GlareHover from "@/components/GlareHover";

const FALLBACK_MESSAGES = [
  "Your city evolves",
  "Time passes",
  "The world changes",
  "History unfolds",
  "Life goes on",
];

type State = { index: number; trigger: boolean; pool: string[] };
type Action =
  | { type: "cycle_out" }
  | { type: "cycle_in" }
  | { type: "reset" }
  | { type: "set_pool"; pool: string[] };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "cycle_out":
      return { ...state, trigger: false };
    case "cycle_in":
      return { ...state, index: (state.index + 1) % state.pool.length, trigger: true };
    case "reset":
      return { ...state, index: 0, trigger: true };
    case "set_pool":
      return { ...state, pool: action.pool };
    default:
      return state;
  }
}

type LoadingOverlayProps = {
  visible: boolean;
  messages?: string[] | null;
};

export function LoadingOverlay({ visible, messages }: LoadingOverlayProps) {
  const [state, dispatch] = useReducer(reducer, {
    index: 0,
    trigger: true,
    pool: FALLBACK_MESSAGES,
  });

  const newPool = messages && messages.length > 0 ? messages : FALLBACK_MESSAGES;
  if (newPool[0] !== state.pool[0]) {
    dispatch({ type: "set_pool", pool: newPool });
  }

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

  const text = state.pool[state.index % state.pool.length];

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
          key={`${state.index}-${text}`}
          preset="fade-in-blur"
          speedReveal={3}
          speedSegment={0.8}
          trigger={state.trigger}
          per="word"
          as="p"
          className="text-white/50 text-[15px] font-medium"
        >
          {text}
        </TextEffect>
      </div>
    </div>
  );
}
