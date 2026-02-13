"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { CityImage } from "@/app/components/city-image";
import { StatsBar } from "@/app/components/stats-bar";
import { EventDrawer } from "@/app/components/event-drawer";
import { LoadingOverlay } from "@/app/components/loading-overlay";
import { ResultCard } from "@/app/components/result-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  type GameState,
  type Stats,
  type Choice,
  type GameEvent,
  type HistoryEntry,
  type CivilizationId,
  createInitialState,
  saveGameState,
  loadGameState,
  clearGameState,
  applyChoiceEffects,
  buildCityDescription,
  formatYear,
  CIVILIZATION_IMAGE_PATHS,
} from "@/app/lib/game-state";

const MAX_TURNS = 25;

/** Convert ArrayBuffer to base64 in chunks to avoid "Maximum call stack size exceeded". */
function arrayBufferToBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  const chunkSize = 8192;
  let binary = "";
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/** Fetch the static civilization base image and return as base64 (no initial image generation). */
async function fetchBaseImage(civilization: CivilizationId): Promise<{ image: string; mimeType: string }> {
  const paths = CIVILIZATION_IMAGE_PATHS[civilization];
  const tryPath = async (url: string, mime: string): Promise<{ image: string; mimeType: string } | null> => {
    const res = await fetch(url);
    if (!res.ok) return null;
    const blob = await res.blob();
    const buf = await blob.arrayBuffer();
    const base64 = arrayBufferToBase64(buf);
    return { image: base64, mimeType: mime };
  };
  const jpg = await tryPath(paths.jpg, "image/jpeg");
  if (jpg) return jpg;
  const png = await tryPath(paths.png, "image/png");
  if (png) return png;
  throw new Error(`Base image not found for ${civilization}. Add rome.jpg, india.jpg, egypt.jpg (or .png) to public/civilizations/`);
}

async function fetchLoadingMessages(
  phase: "processing" | "loading",
  eventTitle?: string,
  choiceLabel?: string,
  year?: number,
): Promise<string[] | null> {
  try {
    const res = await fetch("/api/game/loading-messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phase, eventTitle, choiceLabel, year }),
    });
    if (!res.ok) return null;
    const { messages } = await res.json();
    return messages;
  } catch {
    return null;
  }
}

async function fetchEvent(state: GameState): Promise<GameEvent> {
  const res = await fetch("/api/game/generate-event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      turn: state.turn,
      year: state.year,
      stats: state.stats,
      history: state.history,
      civilization: state.civilization,
    }),
  });
  if (!res.ok) throw new Error("Failed to generate event");
  return res.json();
}

async function fetchImage(
  prompt: string,
  previousImage?: string | null,
  previousImageMimeType?: string,
  population?: number,
  civilization?: CivilizationId
): Promise<{ image: string; mimeType: string }> {
  const res = await fetch("/api/game/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      previousImage: previousImage || undefined,
      previousImageMimeType,
      population,
      civilization,
    }),
  });
  if (!res.ok) throw new Error("Failed to generate image");
  return res.json();
}

type GamePageClientProps = {
  gameId: string;
  initialCivilization?: CivilizationId;
};

export function GamePageClient({ gameId, initialCivilization }: GamePageClientProps) {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [scrubEntry, setScrubEntry] = useState<HistoryEntry | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<string[] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const initRef = useRef(false);

  const goHome = useCallback(() => {
    router.push("/");
  }, [router]);

  // Load or create game state for this gameId
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const saved = loadGameState(gameId);
    if (saved && saved.currentImage) {
      if (saved.phase === "processing" || saved.phase === "loading") {
        saved.phase = "idle";
      }
      setGameState({ ...saved, lastChoiceStatDeltas: null });
      setInitialized(true);
    } else {
      const civilization = initialCivilization ?? "rome";
      const initial = createInitialState(civilization);
      setGameState(initial);
      setInitialized(true);
    }
  }, [gameId, initialCivilization]);

  useEffect(() => {
    if (!initialized || !gameState) return;
    if (gameState.turn === 0 && !gameState.currentImage && gameState.phase === "loading") {
      startNewGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const startNewGame = useCallback(async () => {
    setErrorMessage(null);
    const state = createInitialState(initialCivilization ?? "rome");

    try {
      // Show base image immediately so the user sees Rome/India/Egypt right away
      const baseImage = await fetchBaseImage(state.civilization);
      setGameState({
        ...state,
        currentImage: baseImage.image,
        currentImageMimeType: baseImage.mimeType,
        phase: "loading",
      });

      const event = await fetchEvent(state);

      // Use base image for the first event (no wait for image generation)
      const newState: GameState = {
        ...state,
        currentImage: baseImage.image,
        currentImageMimeType: baseImage.mimeType,
        currentEvent: event,
        phase: "event",
      };
      setGameState(newState);
      saveGameState(newState, gameId);
    } catch (error) {
      console.error("Failed to start game:", error);
      setErrorMessage("Something went wrong");
      setGameState((prev) => (prev ? { ...prev, phase: "idle" } : prev));
      try {
        const event = await fetchEvent(state);
        setGameState((prev) =>
          prev ? { ...prev, currentEvent: event, phase: "event" } : prev
        );
        setErrorMessage(null);
      } catch {
        console.error("Failed to start game completely");
      }
    }
  }, [gameId, initialCivilization]);

  const handleChoice = useCallback(
    async (choice: Choice) => {
      if (!gameState || choosing) return;
      setChoosing(true);

      const newStats = applyChoiceEffects(gameState.stats, choice.effects);
      const newYear = gameState.year + (gameState.currentEvent?.yearAdvance ?? 5);
      const newTurn = gameState.turn + 1;

      const historyEntry: HistoryEntry = {
        turn: gameState.turn,
        year: gameState.year,
        eventTitle: gameState.currentEvent?.title ?? "",
        choiceLabel: choice.label,
        image: gameState.currentImage,
        imageMimeType: gameState.currentImageMimeType,
      };

      const processingState: GameState = {
        ...gameState,
        stats: newStats,
        year: newYear,
        turn: newTurn,
        history: [...gameState.history, historyEntry],
        currentEvent: null,
        phase: "processing",
      };
      setGameState(processingState);
      setLoadingMessages(null);

      fetchLoadingMessages(
        "processing",
        gameState.currentEvent?.title,
        choice.label,
        gameState.year,
      ).then((msgs) => { if (msgs) setLoadingMessages(msgs); });

      if (newTurn >= MAX_TURNS || newStats.population <= 0) {
        const gameOverState: GameState = {
          ...processingState,
          phase: "idle",
          gameOver: true,
        };
        setGameState(gameOverState);
        saveGameState(gameOverState, gameId);
        setChoosing(false);
        return;
      }

      try {
        const choiceVisualPrompt = choice.visualChange || buildCityDescription(processingState, choice.label);
        const choiceImageResult = await fetchImage(
          choiceVisualPrompt,
          gameState.currentImage,
          gameState.currentImageMimeType,
          newStats.population,
          processingState.civilization
        );

        const deltas: Partial<Stats> = {};
        if (newStats.population !== gameState.stats.population) deltas.population = newStats.population - gameState.stats.population;
        if (newStats.gold !== gameState.stats.gold) deltas.gold = newStats.gold - gameState.stats.gold;
        if (newStats.food !== gameState.stats.food) deltas.food = newStats.food - gameState.stats.food;
        if (newStats.defense !== gameState.stats.defense) deltas.defense = newStats.defense - gameState.stats.defense;
        if (newStats.culture !== gameState.stats.culture) deltas.culture = newStats.culture - gameState.stats.culture;

        const outcomeState: GameState = {
          ...processingState,
          previousImage: gameState.currentImage,
          currentImage: choiceImageResult.image,
          currentImageMimeType: choiceImageResult.mimeType,
          outcomeText: choice.outcome || `You chose: ${choice.label}`,
          phase: "outcome",
          lastChoiceStatDeltas: Object.keys(deltas).length > 0 ? deltas : null,
        };
        setGameState(outcomeState);
        saveGameState(outcomeState, gameId);
      } catch (error) {
        console.error("Error processing choice:", error);
        const deltas: Partial<Stats> = {};
        if (newStats.population !== gameState.stats.population) deltas.population = newStats.population - gameState.stats.population;
        if (newStats.gold !== gameState.stats.gold) deltas.gold = newStats.gold - gameState.stats.gold;
        if (newStats.food !== gameState.stats.food) deltas.food = newStats.food - gameState.stats.food;
        if (newStats.defense !== gameState.stats.defense) deltas.defense = newStats.defense - gameState.stats.defense;
        if (newStats.culture !== gameState.stats.culture) deltas.culture = newStats.culture - gameState.stats.culture;

        const failState: GameState = {
          ...processingState,
          outcomeText: choice.outcome || `You chose: ${choice.label}`,
          phase: "outcome",
          lastChoiceStatDeltas: Object.keys(deltas).length > 0 ? deltas : null,
        };
        setGameState(failState);
        saveGameState(failState, gameId);
      } finally {
        setChoosing(false);
      }
    },
    [gameState, choosing, gameId]
  );

  const handleNextTurn = useCallback(async () => {
    if (!gameState || choosing) return;
    setChoosing(true);
    setErrorMessage(null);

    const loadingState: GameState = { ...gameState, phase: "loading" };
    setGameState(loadingState);

    const lastHistory = gameState.history[gameState.history.length - 1];
    setLoadingMessages(null);
    fetchLoadingMessages("loading", lastHistory?.eventTitle, lastHistory?.choiceLabel, gameState.year)
      .then((msgs) => { if (msgs) setLoadingMessages(msgs); });

    try {
      const event = await fetchEvent(gameState);

      let eventImage: { image: string; mimeType: string } | null = null;
      if (event.visualChange && gameState.currentImage) {
        try {
          eventImage = await fetchImage(
            event.visualChange,
            gameState.currentImage,
            gameState.currentImageMimeType,
            gameState.stats.population,
            gameState.civilization
          );
        } catch {
          // fallback
        }
      }

      const newState: GameState = {
        ...gameState,
        previousImage: eventImage ? gameState.currentImage : null,
        currentImage: eventImage?.image ?? gameState.currentImage,
        currentImageMimeType: eventImage?.mimeType ?? gameState.currentImageMimeType,
        currentEvent: event,
        phase: "event",
        lastChoiceStatDeltas: null,
      };
      setGameState(newState);
      saveGameState(newState, gameId);
    } catch {
      setErrorMessage("Something went wrong");
      setGameState({ ...gameState, phase: "idle" });
    } finally {
      setChoosing(false);
    }
  }, [gameState, choosing, gameId]);

  const handleNewGame = useCallback(() => {
    clearGameState(gameId);
    goHome();
  }, [gameId, goHome]);

  if (!gameState) {
    return (
      <div className="h-screen bg-black flex items-center justify-center">
        <div className="w-5 h-5 border-[1.5px] border-white/10 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  const isScrubbing = scrubEntry !== null;
  const showDrawer = !isScrubbing && gameState.phase === "event" && gameState.currentEvent != null;
  const showLoading = !isScrubbing && (gameState.phase === "loading" || gameState.phase === "processing");
  const showOutcome = !isScrubbing && gameState.phase === "outcome" && gameState.outcomeText != null;

  const displayImage = isScrubbing ? scrubEntry.image : gameState.currentImage;
  const displayMimeType = isScrubbing ? scrubEntry.imageMimeType : gameState.currentImageMimeType;

  const statsBarProps = displayImage
    ? {
        year: isScrubbing ? scrubEntry.year : gameState.year,
        stats: gameState.stats,
        history: gameState.history,
        onScrub: setScrubEntry,
      }
    : undefined;

  const drawerOrOutcomeOpen = showDrawer || showOutcome;

  return (
    <div className="h-screen w-screen overflow-hidden bg-black relative">
      <CityImage
        image={displayImage}
        previousImage={isScrubbing ? null : gameState.previousImage}
        mimeType={displayMimeType}
        loading={showLoading}
      />

      {displayImage && (
        <div className={drawerOrOutcomeOpen ? "max-md:hidden" : ""}>
          <StatsBar
            year={isScrubbing ? scrubEntry.year : gameState.year}
            stats={gameState.stats}
            history={gameState.history}
            onScrub={setScrubEntry}
          />
        </div>
      )}

      <EventDrawer
        event={gameState.currentEvent}
        visible={showDrawer}
        onChoose={handleChoice}
        disabled={choosing}
        statsBarProps={statsBarProps}
      />

      <LoadingOverlay visible={showLoading} messages={loadingMessages} />

      <ResultCard
        text={gameState.outcomeText ?? ""}
        visible={showOutcome}
        onContinue={handleNextTurn}
        statDeltas={gameState.lastChoiceStatDeltas ?? undefined}
        statsBarProps={statsBarProps}
      />

      {gameState.gameOver && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md">
          <Card className="max-w-sm bg-black/50 backdrop-blur-2xl border-white/[0.08] text-center gap-3 py-6">
            <CardContent className="px-6 py-0 space-y-4">
              <Badge variant="secondary" className="bg-white/[0.08] text-white/50 border-white/[0.06] text-[12px] uppercase tracking-wider">
                {gameState.stats.population <= 0 ? "Fallen" : "Complete"}
              </Badge>
              <h1 className="text-2xl font-semibold text-white/95 tracking-tight">
                {gameState.stats.population <= 0
                  ? "Your Civilization Has Fallen"
                  : "Your Civilization Has Reached Its Destiny"}
              </h1>
              <p className="text-white/30 text-[15px]">
                {formatYear(gameState.year)} &middot; {gameState.turn} turns
              </p>
              <div className="bg-white/[0.05] border border-white/[0.08] rounded-xl p-4 text-left text-[15px] text-white/50 space-y-1.5">
                <p>Population: <span className="text-white/80">{gameState.stats.population.toLocaleString()}</span></p>
                <p>Turns survived: <span className="text-white/80">{gameState.turn}</span></p>
                <p>Decisions made: <span className="text-white/80">{gameState.history.length}</span></p>
              </div>
              <Button onClick={handleNewGame} size="sm">
                Play Again
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {errorMessage && (
        <div className="absolute bottom-20 left-4 right-4 z-20 flex justify-center md:left-0 md:right-0">
          <Badge variant="destructive" className="text-xs font-normal px-3 py-1.5 bg-red-500/90 text-white border-0">
            {errorMessage}
          </Badge>
        </div>
      )}

      {gameState.phase === "idle" && !gameState.gameOver && gameState.currentImage && (
        <div className="absolute bottom-16 left-4 right-4 z-20 flex justify-center md:left-0 md:right-0">
          <Button onClick={handleNextTurn} size="sm" className="w-full max-md:w-full md:w-auto">
            Continue
          </Button>
        </div>
      )}

      {gameState.currentImage && !gameState.gameOver && (
        <Button
          variant="outline"
          size="sm"
          onClick={goHome}
          className="absolute top-4 right-4 z-20 bg-black/30 backdrop-blur-xl border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-black/50"
        >
          Home
        </Button>
      )}
    </div>
  );
}
