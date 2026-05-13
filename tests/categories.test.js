import assert from "node:assert/strict";
import { test } from "node:test";
import {
  getAllPlayRoutePaths,
  getAllSelectionRoute,
  getCategoryDefinitions,
  getGroupAllSelectionRoute,
  getLeafSelectionRoute,
  getSelectionRouteParentPath,
  getSelectionRoutePath,
  getSelectionRouteShareLabel,
} from "../lib/categories";

test("top-level categories are flat leaves matching the deck tree", () => {
  assert.deepEqual(
    getCategoryDefinitions().map((category) => category.slug).sort(),
    [
      "companies",
      "conflicts",
      "construction",
      "empires",
      "monarchs",
      "popes",
      "space",
      "tv",
    ],
  );
});

test("leaf routes keep clean share labels and parent paths", () => {
  const route = getLeafSelectionRoute(["monarchs"]);

  assert.ok(route);
  assert.equal(getSelectionRoutePath(route), "/play/monarchs");
  assert.equal(getSelectionRouteParentPath(route), "/play");
  assert.equal(getSelectionRouteShareLabel(route), "Monarch Reigns");
  assert.equal(route.nodeId, "all-monarchs");
});

test("static paths include browse routes (featured is removed)", () => {
  const paths = getAllPlayRoutePaths().map((path) => path.join("/"));

  assert.ok(paths.includes(""));
  assert.ok(paths.includes("all"));
  assert.ok(paths.includes("browse"));
  assert.ok(paths.includes("empires"));
  assert.ok(paths.includes("monarchs"));
  assert.ok(paths.includes("companies"));
  assert.ok(!paths.some((path) => path.startsWith("featured")));
});

test("all route stays anchored at /play/all", () => {
  const route = getAllSelectionRoute();

  assert.equal(getSelectionRoutePath(route), "/play/all");
  assert.equal(getSelectionRouteParentPath(route), "/play");
  assert.equal(route.kind, "all");
  assert.equal(route.nodeId, "all");
});
