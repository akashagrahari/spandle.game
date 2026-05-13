import { defineQuery } from "../../query-definition";

export default defineQuery({
  cards: {
    titleTemplate: "{itemLabel}",
    subtitleTemplate: "Dynasty",
  },
  dirPath: import.meta.dir,
  id: "dynasties-duration",
  minScore: 25,
  title: "Dynasties",
});
