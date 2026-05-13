import { defineQuery } from "../../query-definition";

export default defineQuery({
  cards: {
    titleTemplate: "{itemLabel}",
    subtitleTemplate: "Company",
  },
  dirPath: import.meta.dir,
  id: "companies-and-brands-duration",
  minScore: 40,
  title: "Companies and Brands",
});
