import companiesAndBrandsDuration from "./queries/companies-and-brands-duration/query";
import crewedSpaceMissionsDuration from "./queries/crewed-space-missions-duration/query";
import dynastiesDuration from "./queries/dynasties-duration/query";
import empiresAndKingdomsDuration from "./queries/empires-and-kingdoms-duration/query";
import famousBuildingsConstructionDuration from "./queries/famous-buildings-construction-duration/query";
import monarchReignsDuration from "./queries/monarch-reigns-duration/query";
import papalReignsDuration from "./queries/papal-reigns-duration/query";
import tvSeriesBroadcastDuration from "./queries/tv-series-broadcast-duration/query";
import warsAndConflictsDuration from "./queries/wars-and-conflicts-duration/query";
import { QueryDefinition, SourceRow } from "./query-definition";

interface DeckDefinition {
  children?: readonly DeckDefinition[];
  frequency: number;
  hidden?: boolean;
  rowFilter?: (row: SourceRow) => boolean;
  slug: string;
  sources?: readonly QueryDefinition[];
  themeHue?: number;
  title: string;
}

interface Deck extends DeckDefinition {
  children?: readonly Deck[];
  id: string;
  themeHue: number;
}

const DEFAULT_DECK_THEME_HUE = 0;

function deckDefinitionToDeck(
  deckDefinition: DeckDefinition,
  parentSlugPath: readonly string[],
  inheritedThemeHue = DEFAULT_DECK_THEME_HUE,
): Deck {
  const slugPath = [...parentSlugPath, deckDefinition.slug];
  const themeHue = deckDefinition.themeHue ?? inheritedThemeHue;

  return {
    ...deckDefinition,
    id: slugPath.join("-"),
    themeHue,
    children: deckDefinition.children?.map((child) =>
      deckDefinitionToDeck(child, slugPath, themeHue),
    ),
  };
}

const rootDeckDefinition: DeckDefinition = {
  slug: "all",
  title: "All",
  frequency: 1,
  children: [
    {
      slug: "empires",
      title: "Empires, Kingdoms & Dynasties",
      frequency: 0.2,
      themeHue: 30,
      sources: [empiresAndKingdomsDuration, dynastiesDuration],
    },
    {
      slug: "conflicts",
      title: "Wars & Conflicts",
      frequency: 0.2,
      themeHue: 10,
      sources: [warsAndConflictsDuration],
    },
    {
      slug: "monarchs",
      title: "Monarch Reigns",
      frequency: 0.2,
      themeHue: 280,
      sources: [monarchReignsDuration],
    },
    {
      slug: "popes",
      title: "Papal Reigns",
      frequency: 0.15,
      themeHue: 300,
      sources: [papalReignsDuration],
    },
    {
      slug: "space",
      title: "Space Missions",
      frequency: 0.15,
      themeHue: 220,
      sources: [crewedSpaceMissionsDuration],
    },
    {
      slug: "construction",
      title: "Construction Projects",
      frequency: 0.15,
      themeHue: 160,
      sources: [famousBuildingsConstructionDuration],
    },
    {
      slug: "companies",
      title: "Companies & Brands",
      frequency: 0.2,
      themeHue: 200,
      sources: [companiesAndBrandsDuration],
    },
    {
      slug: "tv",
      title: "TV Series",
      frequency: 0.2,
      themeHue: 60,
      sources: [tvSeriesBroadcastDuration],
    },
  ],
};

export const rootDeck: Deck = deckDefinitionToDeck(rootDeckDefinition, []);

export const topLevelDecks: readonly Deck[] = rootDeck.children ?? [];

export function collectDecks(node: Deck): Deck[] {
  const children = node.children ?? [];
  return [node, ...children.flatMap((child) => collectDecks(child))];
}

export function getAllDeckDefinitions(): Deck[] {
  return collectDecks(rootDeck);
}

export function getDeckBySlugPath(slugPath: readonly string[]): Deck | null {
  let node: Deck | null = rootDeck;
  for (const slug of slugPath) {
    if (!node) return null;
    node =
      (node.children ?? []).find((child) => child.slug === slug) ?? null;
  }
  return node;
}

export type { Deck, DeckDefinition };
