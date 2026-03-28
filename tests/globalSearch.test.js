import test from "node:test";
import assert from "node:assert/strict";
import { buildGlobalSearchIndex, searchGlobalIndex } from "../src/Utils/globalSearch.js";

function makeSearchFixture() {
  return {
    data: {
      inventoryCategories: [{ key: "dry", label: "Dry Storage", accent: "#ccc", type: "other" }],
      inventory: {
        dry: [{ id: "rice", name: "Rice", qty: 2, min: 5, unit: "kg" }],
      },
      tasks: [{ id: "t1", text: "Clean oven", doneBy: null, doneByName: null, date: "2026-03-20" }],
      morningTasks: [{ id: "m1", text: "Open kitchen", done: false }],
      prepTasks: [{ id: "p1", text: "Slice onions", qty: "4 kg", isDone: false }],
      bulletins: [{ id: "b1", text: "Inspection today", priority: "critical", archived: false, postedByName: "HQ" }],
    },
    staff: [{ id: "u1", name: "Dana", role: "cook", active: true, baseName: "Base A" }],
  };
}

test("global search indexes inventory, staff, tasks, and bulletins", () => {
  const index = buildGlobalSearchIndex(makeSearchFixture());
  const types = new Set(index.map((entry) => entry.type));

  assert.equal(types.has("inventory"), true);
  assert.equal(types.has("staff"), true);
  assert.equal(types.has("task"), true);
  assert.equal(types.has("bulletin"), true);
});

test("global search returns the matching page and highest priority result", () => {
  const index = buildGlobalSearchIndex(makeSearchFixture());

  const inventoryResults = searchGlobalIndex(index, "rice");
  assert.equal(inventoryResults[0]?.page, "inventory");
  assert.equal(inventoryResults[0]?.title, "Rice");

  const bulletinResults = searchGlobalIndex(index, "inspection");
  assert.equal(bulletinResults[0]?.type, "bulletin");
  assert.equal(bulletinResults[0]?.page, "home");
});
