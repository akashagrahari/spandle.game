export interface Card {
  durationYears: number;
  endYear: number | null;
  fact: string;
  image: string;
  pageViews: number | null;
  qid: string;
  startYear: number;
  subtitle: string | null;
  title: string;
  wikipediaSlug: string | null;
}

export interface PreparedCardFields {
  id: string;
  deckId: string;
  deckThemeHue: number;
  rank: number;
}

export type PlayedCard = Card &
  PreparedCardFields & {
    played: {
      correct: boolean;
      justPlaced?: boolean;
      placementIndex?: number;
      showDate: boolean;
    };
  };
