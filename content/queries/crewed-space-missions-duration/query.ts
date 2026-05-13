import { defineQuery } from "../../query-definition";

export default defineQuery({
  cards: {
    titleTemplate: "{itemLabel}",
    subtitleTemplate: "Space mission",
  },
  dirPath: import.meta.dir,
  id: "crewed-space-missions-duration",
  minScore: 15,
  title: "Space Missions",
});
