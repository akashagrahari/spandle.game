import assert from "node:assert/strict";
import { test } from "node:test";
import createInitialState from "../lib/create-state";
import {
  checkCorrect,
  drawNextCard,
  prepareDecks,
} from "../lib/game-selection";
import { Card } from "../types/cards";
import { DeckNode } from "../types/decks";
import { GameState, PreparedCard } from "../types/game";

function createDeckNode(overrides: Partial<DeckNode> = {}): DeckNode {
  return {
    difficultyCounts: {
      easy: 2,
      hard: 2,
      normal: 2,
    },
    frequency: 1,
    hidden: false,
    id: "test-deck",
    minScore: 0,
    slug: "test-deck",
    themeHue: 120,
    title: "Test Deck",
    ...overrides,
  };
}

function makeCard(overrides: Partial<Card>): Card {
  return {
    durationYears: 100,
    endYear: 2000,
    fact: "fact",
    image: "img.jpg",
    pageViews: 100_000,
    qid: "Q?",
    startYear: 1900,
    subtitle: null,
    title: "Card",
    wikipediaSlug: null,
    ...overrides,
  };
}

function createCards(): Card[] {
  return [
    makeCard({
      qid: "Q1",
      title: "Card A",
      startYear: 1900,
      endYear: 1950,
      durationYears: 50,
    }),
    makeCard({
      qid: "Q2",
      title: "Card B",
      startYear: 1800,
      endYear: 1900,
      durationYears: 100,
    }),
  ];
}

function createSelectionState(
  selectedRootDeck: DeckNode = createDeckNode(),
  cardsByDeckId: ReadonlyMap<string, Card[]> = new Map([
    ["test-deck", createCards()],
  ]),
): GameState {
  return {
    badlyPlaced: null,
    difficulty: "hard",
    imageCache: [],
    lives: 3,
    next: null,
    nextButOne: null,
    decks: prepareDecks(selectedRootDeck, cardsByDeckId, () => 0),
    played: [],
    random: () => 0,
    recentDeckIds: [],
    selectedRootDeck,
    usedDurations: new Set<number>(),
    usedQids: new Set<string>(),
  };
}

test("drawNextCard never repeats a qid within the same game", () => {
  const state = createSelectionState();

  const first = drawNextCard(state);
  const second = drawNextCard(state);
  const third = drawNextCard(state);

  assert.ok(first?.qid);
  assert.ok(second?.qid);
  assert.notEqual(first?.qid, second?.qid);
  assert.equal(third, null);
});

test("drawNextCard never repeats a duration within the same game", () => {
  const duplicateDurationsDeck = createDeckNode({
    difficultyCounts: {
      easy: 3,
      hard: 3,
      normal: 3,
    },
    id: "duplicate-durations-deck",
    slug: "duplicate-durations-deck",
    title: "Duplicate Durations Deck",
  });
  const state = createSelectionState(
    duplicateDurationsDeck,
    new Map([
      [
        duplicateDurationsDeck.id,
        [
          makeCard({
            qid: "Q1",
            title: "Card A",
            startYear: 1800,
            endYear: 1850,
            durationYears: 50,
          }),
          makeCard({
            qid: "Q2",
            title: "Card B",
            startYear: 1900,
            endYear: 1950,
            durationYears: 50,
          }),
          makeCard({
            qid: "Q3",
            title: "Card C",
            startYear: 1700,
            endYear: 1800,
            durationYears: 100,
          }),
        ],
      ],
    ]),
  );

  const first = drawNextCard(state);
  const second = drawNextCard(state);
  const third = drawNextCard(state);

  assert.ok(first);
  assert.ok(second);
  assert.notEqual(first.durationYears, second.durationYears);
  assert.equal(third, null);
});

test("checkCorrect sorts by duration ascending", () => {
  const prepared: PreparedCard = {
    deckId: "d",
    deckThemeHue: 0,
    durationBucket: 0,
    durationYears: 503,
    endYear: 476,
    fact: "",
    id: "roman-empire",
    image: "",
    pageViews: 0,
    qid: "Q2277",
    rank: 1,
    spacingBucket: 3,
    startYear: -27,
    subtitle: null,
    title: "Roman Empire",
    wikipediaSlug: null,
  };
  const played = [
    {
      ...prepared,
      id: "british-empire",
      qid: "Q8680",
      title: "British Empire",
      startYear: 1583,
      endYear: 1997,
      durationYears: 414,
      played: { correct: true, showDate: true },
    },
    {
      ...prepared,
      id: "byzantine-empire",
      qid: "Q12544",
      title: "Byzantine Empire",
      startYear: 330,
      endYear: 1453,
      durationYears: 1123,
      played: { correct: true, showDate: true },
    },
  ];

  assert.deepEqual(checkCorrect(played, prepared, 1), {
    correct: true,
    delta: 0,
  });
  assert.deepEqual(checkCorrect(played, prepared, 0), {
    correct: false,
    delta: 1,
  });
  assert.deepEqual(checkCorrect(played, prepared, 2), {
    correct: false,
    delta: -1,
  });
});

test("createState excludes decks with no valid cards for the chosen difficulty", async () => {
  const rootDeck = createDeckNode({
    children: [
      createDeckNode({
        difficultyCounts: {
          easy: 0,
          hard: 1,
          normal: 1,
        },
        id: "hard-only-deck",
        slug: "hard-only-deck",
        title: "Hard Only Deck",
      }),
      createDeckNode({
        id: "easy-deck",
        slug: "easy-deck",
        title: "Easy Deck",
      }),
    ],
    difficultyCounts: {
      easy: 2,
      hard: 3,
      normal: 3,
    },
    id: "root",
    slug: "root",
    title: "Root",
  });
  const cardsByDeckId = new Map<string, Card[]>([
    [
      "hard-only-deck",
      [
        makeCard({
          qid: "Q1",
          pageViews: 5_000,
          title: "Card A",
          startYear: 1900,
          endYear: 1950,
          durationYears: 50,
        }),
      ],
    ],
    [
      "easy-deck",
      [
        makeCard({
          qid: "Q2",
          title: "Card B",
          startYear: 1800,
          endYear: 1900,
          durationYears: 100,
        }),
        makeCard({
          qid: "Q3",
          title: "Card C",
          startYear: 1700,
          endYear: 1900,
          durationYears: 200,
        }),
      ],
    ],
  ]);

  const state = await createInitialState(rootDeck, cardsByDeckId, "easy");

  assert.deepEqual(
    state.decks.map((deck) => deck.id),
    ["easy-deck"],
  );
});
