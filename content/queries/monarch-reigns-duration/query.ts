import { defineQuery } from "../../query-definition";
import { monarchTakingOfficeTitle } from "../../query-row-helpers";

export default defineQuery({
  cards: {
    titleTemplate: (row) => {
      const base = monarchTakingOfficeTitle(row);
      return base.replace(/^(.+) becomes (.+)$/u, "Reign of $1 as $2");
    },
  },
  dirPath: import.meta.dir,
  id: "monarch-reigns-duration",
  minScore: 30,
  title: "Monarch Reigns",
});
