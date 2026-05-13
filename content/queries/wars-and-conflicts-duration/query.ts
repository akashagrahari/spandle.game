import { defineQuery } from "../../query-definition";

export default defineQuery({
  cards: {
    titleTemplate: "{itemLabel}",
    subtitleTemplate: "Conflict",
  },
  dirPath: import.meta.dir,
  id: "wars-and-conflicts-duration",
  minScore: 22,
  title: "Wars and Conflicts",
});
