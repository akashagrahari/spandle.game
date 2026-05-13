import { defineQuery } from "../../query-definition";

export default defineQuery({
  cards: {
    titleTemplate: "{itemLabel}",
    subtitleTemplate: "Television series",
  },
  dirPath: import.meta.dir,
  id: "tv-series-broadcast-duration",
  minScore: 25,
  title: "TV Series Broadcasts",
});
