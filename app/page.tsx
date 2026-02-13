"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
  type Choice,
  type GameEvent,
  type HistoryEntry,
  createInitialState,
  saveGameState,
  loadGameState,
  clearGameState,
  applyChoiceEffects,
  buildCityDescription,
  formatYear,
} from "@/app/lib/game-state";

const MAX_TURNS = 25;

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
    }),
  });
  if (!res.ok) throw new Error("Failed to generate event");
  return res.json();
}

async function fetchImage(
  prompt: string,
  previousImage?: string | null,
  previousImageMimeType?: string,
  population?: number
): Promise<{ image: string; mimeType: string }> {
  const res = await fetch("/api/game/generate-image", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      previousImage: previousImage || undefined,
      previousImageMimeType,
      population,
    }),
  });
  if (!res.ok) throw new Error("Failed to generate image");
  return res.json();
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [initialized, setInitialized] = useState(false);
  const [choosing, setChoosing] = useState(false);
  const [scrubEntry, setScrubEntry] = useState<HistoryEntry | null>(null);
  const [loadingMessages, setLoadingMessages] = useState<string[] | null>(null);
  const initRef = useRef(false);

  // Load or create game state
  useEffect(() => {
    if (initRef.current) return;
    initRef.current = true;

    const saved = loadGameState();
    if (saved && saved.currentImage) {
      // Resume from saved state - show the event or go idle
      if (saved.phase === "processing" || saved.phase === "loading") {
        saved.phase = "idle";
      }
      setGameState(saved);
      setInitialized(true);
    } else {
      // New game
      const initial = createInitialState();
      setGameState(initial);
      setInitialized(true);
    }
  }, []);

  // Start the game once initialized with a fresh state
  useEffect(() => {
    if (!initialized || !gameState) return;
    if (gameState.turn === 0 && !gameState.currentImage && gameState.phase === "loading") {
      startNewGame();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialized]);

  const startNewGame = useCallback(async () => {
    const state = createInitialState();
    setGameState(state);

    try {
      // Generate initial image and first event in parallel
      const [imageResult, event] = await Promise.all([
        fetchImage(buildCityDescription(state), null, undefined, state.stats.population),
        fetchEvent(state),
      ]);

      let eventImage = imageResult;
      if (event.visualChange) {
        try {
          eventImage = await fetchImage(
            event.visualChange,
            imageResult.image,
            imageResult.mimeType,
            state.stats.population
          );
        } catch {
          // Fall back to the initial image if event image fails
        }
      }

      const newState: GameState = {
        ...state,
        currentImage: eventImage.image,
        previousImage: imageResult.image !== eventImage.image ? imageResult.image : null,
        currentImageMimeType: eventImage.mimeType,
        currentEvent: event,
        phase: "event",
      };
      setGameState(newState);
      saveGameState(newState);
    } catch (error) {
      console.error("Failed to start game:", error);
      try {
        const event = await fetchEvent(state);
        const newState: GameState = {
          ...state,
          currentEvent: event,
          phase: "event",
        };
        setGameState(newState);
        saveGameState(newState);
      } catch {
        console.error("Failed to start game completely");
      }
    }
  }, []);

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

      // Fetch contextual loading messages in parallel (fire and forget)
      fetchLoadingMessages(
        "processing",
        gameState.currentEvent?.title,
        choice.label,
        gameState.year,
      ).then((msgs) => { if (msgs) setLoadingMessages(msgs); });

      // Check game over
      if (newTurn >= MAX_TURNS || newStats.population <= 0) {
        const gameOverState: GameState = {
          ...processingState,
          phase: "idle",
          gameOver: true,
        };
        setGameState(gameOverState);
        saveGameState(gameOverState);
        setChoosing(false);
        return;
      }

      try {
        const choiceVisualPrompt = choice.visualChange || buildCityDescription(processingState, choice.label);
        const choiceImageResult = await fetchImage(
          choiceVisualPrompt,
          gameState.currentImage,
          gameState.currentImageMimeType,
          newStats.population
        );

        // Go to outcome phase so the player sees what happened
        const outcomeState: GameState = {
          ...processingState,
          previousImage: gameState.currentImage,
          currentImage: choiceImageResult.image,
          currentImageMimeType: choiceImageResult.mimeType,
          outcomeText: choice.outcome || `You chose: ${choice.label}`,
          phase: "outcome",
        };
        setGameState(outcomeState);
        saveGameState(outcomeState);
      } catch (error) {
        console.error("Error processing choice:", error);
        const failState: GameState = {
          ...processingState,
          outcomeText: choice.outcome || `You chose: ${choice.label}`,
          phase: "outcome",
        };
        setGameState(failState);
        saveGameState(failState);
      } finally {
        setChoosing(false);
      }
    },
    [gameState, choosing]
  );

  const handleNextTurn = useCallback(async () => {
    if (!gameState || choosing) return;
    setChoosing(true);

    const loadingState: GameState = { ...gameState, phase: "loading" };
    setGameState(loadingState);

    // Fetch generic loading messages in parallel
    const lastHistory = gameState.history[gameState.history.length - 1];
    setLoadingMessages(null);
    fetchLoadingMessages("loading", lastHistory?.eventTitle, lastHistory?.choiceLabel, gameState.year)
      .then((msgs) => { if (msgs) setLoadingMessages(msgs); });

    try {
      const event = await fetchEvent(gameState);

      // Generate the event impact image
      let eventImage: { image: string; mimeType: string } | null = null;
      if (event.visualChange && gameState.currentImage) {
        try {
          eventImage = await fetchImage(
            event.visualChange,
            gameState.currentImage,
            gameState.currentImageMimeType,
            gameState.stats.population
          );
        } catch {
          // Fall back to current image
        }
      }

      const newState: GameState = {
        ...gameState,
        previousImage: eventImage ? gameState.currentImage : null,
        currentImage: eventImage?.image ?? gameState.currentImage,
        currentImageMimeType: eventImage?.mimeType ?? gameState.currentImageMimeType,
        currentEvent: event,
        phase: "event",
      };
      setGameState(newState);
      saveGameState(newState);
    } catch {
      setGameState({ ...gameState, phase: "idle" });
    } finally {
      setChoosing(false);
    }
  }, [gameState, choosing]);

  const handleNewGame = useCallback(() => {
    clearGameState();
    initRef.current = false;
    const initial = createInitialState();
    setGameState(initial);
    startNewGame();
  }, [startNewGame]);

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

  return (
    <div className="h-screen w-screen overflow-hidden bg-black relative">
      {/* City Image */}
      <CityImage
        image={displayImage}
        previousImage={isScrubbing ? null : gameState.previousImage}
        mimeType={displayMimeType}
        loading={showLoading}
      />

      {/* Stats Bar + Scrubber */}
      {displayImage && (
        <StatsBar
          year={isScrubbing ? scrubEntry.year : gameState.year}
          stats={gameState.stats}
          history={gameState.history}
          onScrub={setScrubEntry}
        />
      )}

      {/* Event Drawer */}
      <EventDrawer
        event={gameState.currentEvent}
        visible={showDrawer}
        onChoose={handleChoice}
        disabled={choosing}
      />

      {/* Loading Overlay */}
      <LoadingOverlay visible={showLoading} messages={loadingMessages} />

      {/* Result Card (outcome of player's choice) */}
      <ResultCard
        text={gameState.outcomeText ?? ""}
        visible={showOutcome}
        onContinue={handleNextTurn}
      />

      {/* Game Over Screen */}
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

      {/* Idle state: Continue button */}
      {gameState.phase === "idle" && !gameState.gameOver && gameState.currentImage && (
        <div className="absolute bottom-16 left-0 right-0 z-20 flex justify-center">
          <Button onClick={handleNextTurn} size="sm">
            Continue
          </Button>
        </div>
      )}

      {/* New Game button (top right) */}
      {gameState.currentImage && !gameState.gameOver && (
        <Button
          variant="outline"
          size="xs"
          onClick={handleNewGame}
          className="absolute top-4 right-4 z-20 bg-black/30 backdrop-blur-xl border-white/[0.08] text-white/40 hover:text-white/70 hover:bg-black/50"
        >
          New Game
        </Button>
      )}
    </div>
  );
}
