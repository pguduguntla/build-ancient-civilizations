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

export type GameState = {
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
};

const STORAGE_KEY = "ancient-city-builder-state";

export const INITIAL_STATS: Stats = {
  population: 200,
  gold: 3,
  food: 3,
  defense: 1,
  culture: 1,
};

export function createInitialState(): GameState {
  return {
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

export function saveGameState(state: GameState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage might be full or unavailable
  }
}

export function loadGameState(): GameState | null {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch {
    // corrupted data
  }
  return null;
}

export function clearGameState(): void {
  localStorage.removeItem(STORAGE_KEY);
}

export function applyChoiceEffects(stats: Stats, effects: Partial<Stats>): Stats {
  return {
    population: Math.max(0, stats.population + (effects.population ?? 0)),
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

export function buildCityDescription(state: GameState, choiceLabel?: string): string {
  const { stats, year, history } = state;
  let desc = `An ancient city settlement in ${formatYear(year)} with approximately ${stats.population} inhabitants.`;

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
