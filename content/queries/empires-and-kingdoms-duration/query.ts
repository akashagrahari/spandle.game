import { defineQuery } from "../../query-definition";

export default defineQuery({
  cards: {
    titleTemplate: "{itemLabel}",
    subtitleTemplate: "Empire or kingdom",
  },
  dirPath: import.meta.dir,
  id: "empires-and-kingdoms-duration",
  minScore: 30,
  title: "Empires and Kingdoms",
});
