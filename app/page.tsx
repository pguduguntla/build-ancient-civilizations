"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import { TextEffect } from "@/components/motion-primitives/text-effect";
import { InView } from "@/components/ui/in-view";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { getGameIds, loadGameState, formatYear } from "@/app/lib/game-state";
import { motion } from "motion/react";
import { CivilizationPicker } from "@/app/components/civilization-picker";
// import { DitheredBackground } from "@/app/components/dithered-background";
import type { CivilizationId } from "@/app/lib/game-state";

const CIVILIZATION_LABELS: Record<CivilizationId, string> = {
  rome: "Ancient Rome",
  india: "Ancient India",
  egypt: "Ancient Egypt",
};

const RECENT_COUNT = 3;

/** Same as result-card primary button for consistency */
const resultCardButtonClass =
  "bg-white/[0.07] border border-white/[0.1] text-white/80 text-[14px] hover:bg-white/[0.12] hover:border-white/[0.15] hover:text-white active:scale-[0.98]";

export default function Home() {
  const router = useRouter();
  const [continuingId, setContinuingId] = useState<string | null>(null);
  const [recentGames, setRecentGames] = useState<{ id: string; civilization: CivilizationId; year: number; turn: number }[]>([]);
  const [selectedCivilization, setSelectedCivilization] = useState<CivilizationId>("india");
  const [showBackground, setShowBackground] = useState(false);
  const [imageReady, setImageReady] = useState(false);

  useEffect(() => {
    const id = setTimeout(() => setShowBackground(true), 0);
    return () => clearTimeout(id);
  }, []);

  useEffect(() => {
    const ids = getGameIds();
    const recentIds = ids.slice(-RECENT_COUNT).reverse();
    const summaries = recentIds
      .map((id) => {
        const state = loadGameState(id);
        if (!state) return null;
        return { id, civilization: state.civilization, year: state.year, turn: state.turn };
      })
      .filter((s): s is NonNullable<typeof s> => s !== null);
    const t = setTimeout(() => setRecentGames(summaries), 0);
    return () => clearTimeout(t);
  }, []);

  const handleNewGame = useCallback(() => {
    const id = crypto.randomUUID();
    router.push(`/game/${id}?civilization=${selectedCivilization}`);
  }, [router, selectedCivilization]);

  const handleContinue = useCallback(
    (gameId: string) => {
      setContinuingId(gameId);
      router.push(`/game/${gameId}`);
    },
    [router]
  );

  return (
    <div className="min-h-screen w-full bg-black flex flex-col relative overflow-hidden">
      {/* Lazy-loaded static dithered image: mounts after idle, fades in when loaded */}
      {showBackground && (
        <div className="absolute inset-0 w-full h-full bg-black overflow-hidden">
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: imageReady ? 1 : 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <img
              src="/dithered-bg.png"
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              onLoad={() => setImageReady(true)}
            />
            {/* Strong vignette: dark edges, clear center */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse 80% 80% at 50% 50%, transparent 18%, rgba(0,0,0,0.45) 45%, rgba(0,0,0,0.78) 70%, rgba(0,0,0,0.95) 100%)",
              }}
            />
          </motion.div>
        </div>
      )}
      {/* Gradient overlay for content readability */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.55) 28%, rgba(0,0,0,0.28) 48%, rgba(0,0,0,0.28) 52%, rgba(0,0,0,0.55) 72%, rgba(0,0,0,0.95) 100%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center max-md:items-stretch px-5 py-12 sm:py-16 max-w-xl max-md:max-w-none mx-auto w-full">
        <InView
          once
          variants={{ hidden: { opacity: 0, y: 8 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.4 }}
        >
          <div className="w-full text-center">
            <Badge
              variant="secondary"
              className="mb-4 bg-white/10 text-white/60 border-0 backdrop-blur-sm text-[13px] font-medium tracking-wide"
            >
              Kingdom Builder
            </Badge>
          </div>
        </InView>

        <InView
          once
          variants={{ hidden: { opacity: 0, y: 10 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, delay: 0.15 }}
        >
          <div className="text-center">
            <TextEffect
              as="h1"
              preset="fade-in-blur"
              per="word"
              className="text-4xl sm:text-5xl font-semibold text-white/95 tracking-tight text-center"
              speedReveal={0.8}
            >
              Build Your Kingdom
            </TextEffect>
          </div>
        </InView>

        <InView
          once
          variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <div className="text-center">
            <p className="text-white/50 text-lg sm:text-xl mt-3 max-w-md mx-auto">
              Shape an ancient civilization. Make choices. Watch your city grow or fall.
            </p>
          </div>
        </InView>

        {/* Inline carousel above New Game */}
        <InView
          once
          as="div"
          variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
          transition={{ duration: 0.5, delay: 0.2 }}
          viewOptions={{ amount: 0.2 }}
        >
          <div className="relative w-full mt-8 max-w-4xl mx-auto overflow-visible">
          {/* Black feathered radial behind carousel so it stands out */}
          <div
            className="absolute inset-0 pointer-events-none min-h-[420px] rounded-3xl"
            style={{
              background:
                "radial-gradient(ellipse 85% 75% at 50% 50%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.35) 35%, rgba(0,0,0,0.08) 60%, transparent 100%)",
            }}
          />
          <div className="relative z-10">
            <CivilizationPicker
              variant="inline"
              onSelect={(civ) => setSelectedCivilization(civ)}
              onSelectionChange={setSelectedCivilization}
              selectedCivilization={selectedCivilization}
              open={false}
            />
          </div>
          </div>
        </InView>

        <div className="w-full">
          <InView
            once
            as="div"
            variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
            transition={{ duration: 0.4 }}
            viewOptions={{ amount: 0.5 }}
          >
            <div className="mt-6 w-full">
              <Button
                size="lg"
                onClick={handleNewGame}
                className="w-full sm:w-auto sm:min-w-[200px] bg-white text-black hover:bg-white/90 font-medium text-base px-8 py-6 rounded-xl"
              >
                New Game
              </Button>
            </div>
          </InView>
        </div>

        {recentGames.length > 0 && (
          <div className="w-full">
            <InView
              once
              as="section"
              variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }}
              transition={{ duration: 0.5, delay: 0.15 }}
              viewOptions={{ amount: 0.2 }}
            >
            <div className="w-full mt-14 sm:mt-16">
            <p className="text-white/50 text-[13px] font-medium tracking-wide uppercase mb-3 px-1">
              Recent games
            </p>
            <ul className="space-y-2">
              {recentGames.map((game) => (
                <li key={game.id}>
                  <button
                    type="button"
                    onClick={() => handleContinue(game.id)}
                    disabled={continuingId !== null}
                    className={cn(
                      "w-full text-left rounded-xl p-4 backdrop-blur-xl transition-colors disabled:opacity-70 disabled:cursor-not-allowed active:scale-[0.99]",
                      resultCardButtonClass
                    )}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-white/90 font-medium text-[15px]">
                          {CIVILIZATION_LABELS[game.civilization]}
                        </p>
                        <p className="text-white/50 text-[13px] mt-0.5">
                          {formatYear(game.year)} · Turn {game.turn}
                        </p>
                      </div>
                      <span className="text-white/60 text-[13px] shrink-0">
                        {continuingId === game.id ? "Loading…" : "Continue"}
                      </span>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
            </div>
          </InView>
          </div>
        )}
      </div>
    </div>
  );
}
