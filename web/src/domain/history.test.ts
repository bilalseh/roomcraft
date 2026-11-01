import { describe, expect, it } from "vitest";
import { record, redo, startHistory, undo } from "./history";

describe("history", () => {
  it("undoes and redoes in order", () => {
    const history = record(record(startHistory("a"), "b"), "c");

    const back = undo(undo(history));
    expect(back.present).toBe("a");
    expect(redo(back).present).toBe("b");
    expect(redo(redo(back)).present).toBe("c");
  });

  it("forgets the redo steps after a new change", () => {
    const history = record(undo(record(startHistory("a"), "b")), "c");

    expect(history.future).toEqual([]);
    expect(redo(history)).toBe(history);
  });

  it("does nothing at either end", () => {
    const history = startHistory("a");

    expect(undo(history)).toBe(history);
    expect(redo(history)).toBe(history);
  });

  it("ignores a change that is not a change", () => {
    const history = startHistory({ value: 1 });

    expect(record(history, history.present)).toBe(history);
  });

  it("keeps a limited number of steps", () => {
    let history = startHistory(0);
    for (let step = 1; step <= 5; step++) history = record(history, step, 3);

    expect(history.past).toEqual([2, 3, 4]);
  });
});
