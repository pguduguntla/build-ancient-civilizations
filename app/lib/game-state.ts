export type Stats = {
  population: number;
  gold: number;
  food: number;
  defense: number;
  culture: number;
};

export type Choice = {
  id: string;
  label: string;
  effects: Partial<Stats>;
  visualChange: string;
  outcome: string;
};

export type GameEvent = {
  title: string;
  description: string;
  visualChange: string;
  choices: Choice[];
  yearAdvance: number;
};

export type HistoryEntry = {
  turn: number;
  year: number;
  eventTitle: string;
  choiceLabel: string;
  image: string | null;
  imageMimeType: string;
};

export type CivilizationId = "rome" | "india" | "egypt";

/** Full-quality images for the actual game (initial/base image). */
export const CIVILIZATION_IMAGE_PATHS: Record<CivilizationId, { jpg: string; png: string }> = {
  rome: { jpg: "/civilizations/rome.jpg", png: "/civilizations/rome.png" },
  india: { jpg: "/civilizations/india.jpg", png: "/civilizations/india.png" },
  egypt: { jpg: "/civilizations/egypt.jpg", png: "/civilizations/egypt.png" },
};

/** Compressed images for the civilization picker carousel only. */
export const CIVILIZATION_PICKER_IMAGE_PATHS: Record<CivilizationId, { jpg: string; png: string }> = {
  rome: { jpg: "/civilizations/rome.jpg", png: "/civilizations/rome-compressed.png" },
  india: { jpg: "/civilizations/india.jpg", png: "/civilizations/india-compressed.png" },
  egypt: { jpg: "/civilizations/egypt.jpg", png: "/civilizations/egypt-compressed.png" },
};

export type GameState = {
  civilization: CivilizationId;
  turn: number;
  year: number;
  stats: Stats;
  currentImage: string | null;
  previousImage: string | null;
  currentImageMimeType: string;
  history: HistoryEntry[];
  currentEvent: GameEvent | null;
  phase: "loading" | "event" | "processing" | "outcome" | "idle";
  outcomeText: string | null;
  gameOver: boolean;
  /** Deltas from the last choice (for outcome UI). Not persisted. */
  lastChoiceStatDeltas?: Partial<Stats> | null;
};

const STATE_KEY_PREFIX = "ancient-city-builder-state-";
const GAME_IDS_KEY = "ancient-city-builder-game-ids";

export const INITIAL_STATS: Stats = {
  population: 1500,
  gold: 3,
  food: 3,
  defense: 1,
  culture: 1,
};

export function createInitialState(civilization: CivilizationId = "rome"): GameState {
  return {
    civilization,
    turn: 0,
    year: -1000,
    stats: { ...INITIAL_STATS },
    currentImage: null,
    previousImage: null,
    currentImageMimeType: "image/png",
    history: [],
    currentEvent: null,
    phase: "loading",
    outcomeText: null,
    gameOver: false,
  };
}

function getStateKey(gameId: string): string {
  return `${STATE_KEY_PREFIX}${gameId}`;
}

export function getGameIds(): string[] {
  try {
    const raw = localStorage.getItem(GAME_IDS_KEY);
    if (!raw) return [];
    const ids = JSON.parse(raw) as unknown;
    return Array.isArray(ids) ? ids.filter((id): id is string => typeof id === "string") : [];
  } catch {
    return [];
  }
}

function addGameId(gameId: string): void {
  const ids = getGameIds();
  if (ids.includes(gameId)) return;
  try {
    localStorage.setItem(GAME_IDS_KEY, JSON.stringify([...ids, gameId]));
  } catch {
    // ignore
  }
}

function removeGameId(gameId: string): void {
  const ids = getGameIds().filter((id) => id !== gameId);
  try {
    if (ids.length) localStorage.setItem(GAME_IDS_KEY, JSON.stringify(ids));
    else localStorage.removeItem(GAME_IDS_KEY);
  } catch {
    // ignore
  }
}

export function saveGameState(state: GameState, gameId: string): void {
  try {
    const key = getStateKey(gameId);
    localStorage.setItem(key, JSON.stringify(state));
    addGameId(gameId);
  } catch {
    // localStorage might be full or unavailable
  }
}

export function loadGameState(gameId: string): GameState | null {
  try {
    const saved = localStorage.getItem(getStateKey(gameId));
    if (!saved) return null;
    const parsed = JSON.parse(saved) as Partial<GameState>;
    if (!parsed || typeof parsed.turn !== "number") return null;
    return {
      ...parsed,
      civilization: (parsed.civilization === "rome" || parsed.civilization === "india" || parsed.civilization === "egypt")
        ? parsed.civilization
        : "rome",
    } as GameState;
  } catch {
    return null;
  }
}

export function clearGameState(gameId: string): void {
  localStorage.removeItem(getStateKey(gameId));
  removeGameId(gameId);
}

/** Max fraction of population that can be lost in a single choice (unless catastrophic). */
const MAX_POPULATION_LOSS_FRACTION = 0.15;

export function applyChoiceEffects(stats: Stats, effects: Partial<Stats>): Stats {
  const rawPopChange = effects.population ?? 0;
  const newPopulation =
    rawPopChange >= 0
      ? stats.population + rawPopChange
      : Math.max(
          0,
          stats.population - Math.min(
            Math.abs(rawPopChange),
            Math.max(50, Math.ceil(stats.population * MAX_POPULATION_LOSS_FRACTION))
          )
        );

  return {
    population: newPopulation,
    gold: Math.max(0, Math.min(5, stats.gold + (effects.gold ?? 0))),
    food: Math.max(0, Math.min(5, stats.food + (effects.food ?? 0))),
    defense: Math.max(0, Math.min(5, stats.defense + (effects.defense ?? 0))),
    culture: Math.max(0, Math.min(5, stats.culture + (effects.culture ?? 0))),
  };
}

export function formatYear(year: number): string {
  if (year < 0) return `${Math.abs(year)} BCE`;
  return `${year} CE`;
}

const CIVILIZATION_CONTEXT: Record<CivilizationId, string> = {
  rome: "Ancient Roman",
  india: "Ancient Indian",
  egypt: "Ancient Egyptian",
};

export function buildCityDescription(state: GameState, choiceLabel?: string): string {
  const { stats, year, history, civilization } = state;
  const civName = CIVILIZATION_CONTEXT[civilization];
  let desc = `A ${civName} city settlement in ${formatYear(year)} with approximately ${stats.population} inhabitants.`;

  if (stats.population < 500) desc += " A small humble village with basic huts and farmland.";
  else if (stats.population < 2000) desc += " A growing town with stone buildings, a marketplace, and surrounding farms.";
  else if (stats.population < 10000) desc += " A thriving city with temples, walls, and bustling streets.";
  else desc += " A grand metropolis with monumental architecture, large walls, and sprawling districts.";

  if (stats.defense >= 4) desc += " Strong fortifications and watchtowers surround the city.";
  if (stats.culture >= 4) desc += " Beautiful temples and monuments adorn the skyline.";
  if (stats.gold >= 4) desc += " A wealthy trading hub with ornate buildings and a large marketplace.";
  if (stats.food >= 4) desc += " Lush farmlands and granaries surround the settlement.";

  if (choiceLabel) {
    desc += ` The city has recently undergone changes: ${choiceLabel}.`;
  }

  const recentHistory = history.slice(-3);
  if (recentHistory.length > 0) {
    desc += " Recent history: " + recentHistory.map((h) => h.choiceLabel).join("; ") + ".";
  }

  return desc;
}
