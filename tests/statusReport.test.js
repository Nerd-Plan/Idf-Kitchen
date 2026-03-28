import test from "node:test";
import assert from "node:assert/strict";
import { buildStatusReportHtml, buildStatusReportModel } from "../src/Utils/statusReport.js";

function makeReportFixture() {
  return {
    data: {
      inventory: {
        dry: [{ id: "rice", name: "Rice", qty: 2, min: 5, unit: "kg" }],
      },
      tasks: [{ id: "t1", text: "Clean oven", doneBy: null, doneByName: null, date: "2026-03-20" }],
      morningTasks: [{ id: "m1", text: "Open kitchen", done: false }],
      prepTasks: [{ id: "p1", text: "Slice onions", qty: "4 kg", isDone: false }],
      bulletins: [{ id: "b1", text: "<b>Inspection</b>", priority: "critical", archived: false, postedByName: "HQ" }],
      salads: [{ id: "s1", name: "Green salad", level: 20 }],
      hotFood: [{ id: "h1", name: "Soup", cookedAt: new Date(Date.now() - 4 * 3_600_000).toISOString() }],
      feedback: [{ stars: 5 }, { stars: 3 }],
    },
    staff: [{ id: "u1", name: "Dana & Co", role: "cook", active: true, baseName: "Base A" }],
    user: { name: "Tester", baseName: "Base A" },
    generatedAt: "2026-03-20T10:15:00.000Z",
  };
}

test("status report model summarizes critical counts", () => {
  const model = buildStatusReportModel(makeReportFixture());

  assert.equal(model.lowStockItems.length, 1);
  assert.equal(model.tasks.find((item) => item.label === "משימות יומיות")?.open, 1);
  assert.equal(model.tasks.find((item) => item.label === "פתיחת בוקר")?.open, 1);
  assert.equal(model.tasks.find((item) => item.label === "הכנות")?.open, 1);
  assert.equal(model.feedback.average, "4.0");
});

test("status report html escapes user content", () => {
  const html = buildStatusReportHtml(makeReportFixture());

  assert.equal(html.includes("&lt;b&gt;Inspection&lt;/b&gt;"), true);
  assert.equal(html.includes("Dana &amp; Co"), true);
  assert.equal(html.includes("<b>Inspection</b>"), false);
});
