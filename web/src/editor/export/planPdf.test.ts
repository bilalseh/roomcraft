import { jsPDF } from "jspdf";
import { describe, expect, it } from "vitest";
import { demoProject } from "../../project/demoProject";
import { buildPlanPdf } from "./planPdf";

describe("buildPlanPdf", () => {
  it("lays out the plan page and the shopping list page", () => {
    const { name, room, furniture, materials } = demoProject();

    const doc = buildPlanPdf(jsPDF, {
      name,
      layout: { room, furniture, materials },
      units: "metric",
      snapshot: null,
      date: new Date("2026-11-02T12:00:00Z"),
    });

    // jsPDF writes text uncompressed, so the content can be checked directly.
    const content = doc.output();
    expect(doc.getNumberOfPages()).toBe(2);
    for (const text of [
      "Sunny living room",
      "5.2 m",
      "Shopping list",
      "Three-seat sofa",
      "Media unit with TV",
      "Budget: $4,000",
    ]) {
      expect(content).toContain(text);
    }
  });
});
