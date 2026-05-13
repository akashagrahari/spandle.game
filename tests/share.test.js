import assert from "node:assert/strict";
import { test } from "node:test";
import { buildShareText, getShareResults } from "../lib/share";

test("daily share text uses the Outlast brand and compact format", () => {
  const shareText = buildShareText({
    dateKey: "2026-03-23",
    difficulty: "easy",
    mode: "daily",
    path: "/daily",
    results: [true, false, true, true, true, false, true, true],
    score: 6,
  });

  assert.equal(
    shareText,
    [
      "#outlast / Daily for Mar 23 2026",
      "",
      "🟩🟥🟩🟩🟩🟥🟩🟩",
      "",
      "Score / 6 / Bronze",
      "",
      "https://outlast.game/daily",
    ].join("\n"),
  );
});

test("free play share text includes category, difficulty, score, and best", () => {
  const shareText = buildShareText({
    difficulty: "normal",
    highscore: 25,
    mode: "free-play",
    path: "/play/conflicts",
    results: [true, false, true, true, true, false, true, true],
    score: 6,
    selectionRoute: {
      kind: "leaf",
      nodeId: "all-conflicts",
    },
  });

  assert.equal(
    shareText,
    [
      "#outlast / Wars & Conflicts / Normal",
      "",
      "🟩🟥🟩🟩🟩🟥🟩🟩",
      "",
      "Score / 6 / Bronze",
      "Best / 25 / Gold",
      "",
      "https://outlast.game/play/conflicts",
    ].join("\n"),
  );
});

test("share results follow played order rather than timeline order", () => {
  const results = getShareResults([
    {
      durationYears: 50,
      endYear: 1950,
      fact: "",
      id: "b",
      image: "",
      deckId: "deck",
      deckThemeHue: 0,
      pageViews: null,
      played: {
        correct: false,
        placementIndex: 2,
        showDate: true,
      },
      qid: "Q2",
      rank: 1,
      startYear: 1900,
      subtitle: null,
      title: "B",
      wikipediaSlug: null,
    },
    {
      durationYears: 100,
      endYear: 1900,
      fact: "",
      id: "a",
      image: "",
      deckId: "deck",
      deckThemeHue: 0,
      pageViews: null,
      played: {
        correct: true,
        placementIndex: 0,
        showDate: true,
      },
      qid: "Q1",
      rank: 0,
      startYear: 1800,
      subtitle: null,
      title: "A",
      wikipediaSlug: null,
    },
    {
      durationYears: 200,
      endYear: 2000,
      fact: "",
      id: "c",
      image: "",
      deckId: "deck",
      deckThemeHue: 0,
      pageViews: null,
      played: {
        correct: true,
        placementIndex: 1,
        showDate: true,
      },
      qid: "Q3",
      rank: 2,
      startYear: 1800,
      subtitle: null,
      title: "C",
      wikipediaSlug: null,
    },
  ]);

  assert.deepEqual(results, [true, true, false]);
});
