import { Card, PlayedCard } from "../types/cards";
import { DeckNode } from "../types/decks";
import { GameDifficulty, GameState, RandomSource } from "../types/game";
import { DailyGameSnapshot, GameMode, SelectionRoute } from "../types/routes";
import createState, {
  filterCardsByDifficulty,
  hasDeckForDifficulty,
} from "./create-state";
import { createDeckNodeListMap, resolveDeckSelection } from "./deck-tree";
import { preloadImage, prepareDecks } from "./game-selection";
import { createSeededRandom } from "./seeded-random";

function createEphemeralRandom(): RandomSource {
  return (() => Math.random()) as RandomSource;
}

export function filterCardsBySelectionRoute(
  cardsByDeckId: ReadonlyMap<string, Card[]>,
  _selectionRoute: SelectionRoute | null,
): Map<string, Card[]> {
  return new Map(cardsByDeckId);
}

export function resolveSelectionDeck(
  deckNodes: DeckNode[],
  mode: GameMode,
  selectionRoute: SelectionRoute | null,
  rootDeckId: string | null,
): DeckNode | null {
  if (!rootDeckId) {
    return null;
  }

  const deckNodeMap = createDeckNodeListMap(deckNodes);
  const selectionDeckId =
    mode === "daily" ? rootDeckId : (selectionRoute?.nodeId ?? rootDeckId);

  return resolveDeckSelection(deckNodeMap, selectionDeckId);
}

export async function createStateWithRetry(
  selectedRootDeck: DeckNode,
  cardsByDeckId: ReadonlyMap<string, Card[]>,
  difficulty: GameDifficulty,
  options: {
    initialUsedQids?: string[];
    random?: () => number;
  } = {},
): Promise<GameState> {
  let excludedQids = options.initialUsedQids ?? [];

  while (true) {
    try {
      return await createState(selectedRootDeck, cardsByDeckId, difficulty, {
        initialUsedQids: excludedQids,
        random: options.random,
      });
    } catch (error) {
      if (excludedQids.length === 0) {
        throw error;
      }

      excludedQids = excludedQids.slice(0, Math.floor(excludedQids.length / 2));
    }
  }
}

export function normalizePlayedCardsForSnapshot(
  played: PlayedCard[],
): PlayedCard[] {
  return played.map((card, index) => ({
    ...card,
    played: {
      ...card.played,
      justPlaced: false,
      placementIndex: card.played.placementIndex ?? index,
      showDate: true,
    },
  }));
}

function deriveUsedQids(snapshot: DailyGameSnapshot): Set<string> {
  return new Set(
    [
      ...snapshot.played.map((card) => card.qid),
      snapshot.next?.qid ?? null,
      snapshot.nextButOne?.qid ?? null,
    ].filter((qid): qid is string => qid !== null),
  );
}

function deriveUsedDurations(snapshot: DailyGameSnapshot): Set<number> {
  return new Set(
    [
      ...snapshot.played.map((card) => card.durationYears),
      snapshot.next?.durationYears ?? null,
      snapshot.nextButOne?.durationYears ?? null,
    ].filter((duration): duration is number => duration !== null),
  );
}

export function createCompletedGameState(
  played: PlayedCard[],
  difficulty: GameDifficulty,
): GameState {
  return {
    badlyPlaced: null,
    difficulty,
    imageCache: [],
    lives: 0,
    next: null,
    nextButOne: null,
    decks: [],
    played: normalizePlayedCardsForSnapshot(played),
    random: createEphemeralRandom(),
    recentDeckIds: [],
    selectedRootDeck: null,
    usedDurations: new Set<number>(played.map((card) => card.durationYears)),
    usedQids: new Set<string>(),
  };
}

export function createDailyGameSnapshot(
  dateKey: string,
  state: GameState,
): DailyGameSnapshot {
  return {
    deckCursors: state.decks.map((deck) => ({
      drawCursor: deck.drawCursor,
      id: deck.id,
    })),
    dateKey,
    lives: state.lives,
    next: state.next,
    nextButOne: state.nextButOne,
    played: normalizePlayedCardsForSnapshot(state.played),
    randomState: state.random.getState?.() ?? null,
    recentDeckIds: [...state.recentDeckIds],
  };
}

export function createDailyGameStateFromSnapshot(
  snapshot: DailyGameSnapshot,
  selectedRootDeck: DeckNode,
  cardsByDeckId: ReadonlyMap<string, Card[]>,
): GameState {
  const difficulty: GameDifficulty = "easy";
  const random = createSeededRandom(
    snapshot.dateKey,
    snapshot.randomState ?? undefined,
  );
  if (!hasDeckForDifficulty(selectedRootDeck, difficulty, cardsByDeckId)) {
    throw new Error("No valid cards available for this deck and difficulty");
  }

  const filteredCardsByDeckId = filterCardsByDifficulty(
    selectedRootDeck,
    difficulty,
    cardsByDeckId,
  );
  const preparedDecks = prepareDecks(
    selectedRootDeck,
    filteredCardsByDeckId,
    random,
  );
  const deckCursorMap = new Map(
    snapshot.deckCursors.map((deck) => [deck.id, deck.drawCursor]),
  );

  return {
    badlyPlaced: null,
    difficulty,
    imageCache: [
      snapshot.next ? preloadImage(snapshot.next.image) : null,
      snapshot.nextButOne ? preloadImage(snapshot.nextButOne.image) : null,
    ].filter((image): image is HTMLImageElement => image !== null),
    lives: snapshot.lives,
    next: snapshot.next,
    nextButOne: snapshot.nextButOne,
    decks: preparedDecks.map((deck) => ({
      ...deck,
      cards: [...deck.cards],
      drawCursor: deckCursorMap.get(deck.id) ?? deck.drawCursor,
    })),
    played: normalizePlayedCardsForSnapshot(snapshot.played),
    random,
    recentDeckIds: [...snapshot.recentDeckIds],
    selectedRootDeck,
    usedDurations: deriveUsedDurations(snapshot),
    usedQids: deriveUsedQids(snapshot),
  };
}
