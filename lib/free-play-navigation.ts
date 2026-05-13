export type FreePlayRootView = "browse" | "featured" | "landing";

export interface FeaturedFreePlayDeck {
  key: string;
  routeSlug: string;
  slugPath: string[];
  text: string;
}

export const FEATURED_FREE_PLAY_DECKS: readonly FeaturedFreePlayDeck[] = [];

export function getRootFreePlayPath(view: FreePlayRootView): string {
  switch (view) {
    case "browse":
      return "/play/browse";
    case "featured":
      return "/play/featured";
    case "landing":
    default:
      return "/play";
  }
}

export function prefixPlayPath(path: string, view: FreePlayRootView): string {
  if (
    view !== "browse" ||
    !path.startsWith("/play") ||
    path.startsWith("/play/browse")
  ) {
    return path;
  }

  const suffix = path.slice("/play".length);
  return `${getRootFreePlayPath("browse")}${suffix}`;
}
