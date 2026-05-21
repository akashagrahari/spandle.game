import { defineQuery } from "../../query-definition";

export default defineQuery({
  cards: {
    titleTemplate: "Construction of {itemLabel}",
    subtitleTemplate: "Building",
  },
  dirPath: import.meta.dir,
  id: "famous-buildings-construction-duration",
  minScore: 25,
  requireEndYear: true,
  title: "Famous Buildings Under Construction",
});
