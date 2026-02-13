"use client";

import { useEffect, useReducer } from "react";
import { motion } from "motion/react";

type CityImageProps = {
  image: string | null;
  previousImage?: string | null;
  mimeType: string;
  dimmed?: boolean;
  loading?: boolean;
};

type TransitionState = { showPrevious: boolean };
type TransitionAction = { type: "show" } | { type: "hide" };

function transitionReducer(_state: TransitionState, action: TransitionAction): TransitionState {
  switch (action.type) {
    case "show":
      return { showPrevious: true };
    case "hide":
      return { showPrevious: false };
  }
}

export function CityImage({ image, previousImage, mimeType, dimmed, loading }: CityImageProps) {
  const [{ showPrevious }, dispatch] = useReducer(transitionReducer, { showPrevious: false });

  useEffect(() => {
    if (!previousImage) return;
    dispatch({ type: "show" });
    const timer = setTimeout(() => dispatch({ type: "hide" }), 1500);
    return () => clearTimeout(timer);
  }, [previousImage]);

  if (!image) {
    return (
      <div className="absolute inset-0 bg-gradient-to-b from-neutral-950 to-black flex items-center justify-center">
        <div className="text-white/20 text-sm font-medium tracking-wide">Your civilization awaits...</div>
      </div>
    );
  }

  const imgSrc = `data:${mimeType};base64,${image}`;
  const prevSrc = previousImage ? `data:${mimeType};base64,${previousImage}` : null;

  return (
    <div className={`absolute inset-0 overflow-hidden transition-all duration-500 ${dimmed ? "brightness-50" : ""}`}>
      <motion.div
        className="absolute -inset-4"
        animate={loading ? {
          scale: [1, 1.03, 1],
          filter: ["blur(0px)", "blur(2px)", "blur(0px)"],
        } : {
          scale: 1,
          filter: "blur(0px)",
        }}
        transition={loading ? {
          duration: 2.5,
          repeat: Infinity,
          ease: "easeInOut",
        } : {
          duration: 0.5,
          ease: "easeOut",
        }}
      >
        {prevSrc && showPrevious && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={prevSrc}
            alt="Previous city state"
            className="absolute inset-0 w-full h-full object-cover animate-fade-out"
          />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imgSrc}
          alt="Your ancient city"
          className={`absolute inset-0 w-full h-full object-cover ${showPrevious ? "animate-fade-in" : ""}`}
        />
      </motion.div>
    </div>
  );
}
