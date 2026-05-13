import { defineQuery } from "../../query-definition";

export default defineQuery({
  cards: {
    titleTemplate: "Papacy of {itemLabel}",
    subtitleTemplate: "Pope",
  },
  dirPath: import.meta.dir,
  id: "papal-reigns-duration",
  minScore: 20,
  title: "Papal Reigns",
});
