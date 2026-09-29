import { describe, expect, it } from "vitest";
import { bootstrap, maxDD, monte, parseCSV, rollingMean } from "../src/tradingAnalytics";

describe("trading analytics", () => {
  it("computes maximum drawdown", () => {
    expect(maxDD([1, -1, -1, 2])).toBe(-2);
  });

  it("returns rolling means only after the window fills", () => {
    expect(rollingMean([1, 0, 2], 2)).toEqual([
      { i: 1, value: null },
      { i: 2, value: 0.5 },
      { i: 3, value: 1 },
    ]);
  });

  it("bootstrap is reproducible with a seed", () => {
    expect(bootstrap([1, -1, 0, 2], 200, 9)).toEqual(
      bootstrap([1, -1, 0, 2], 200, 9)
    );
  });

  it("Monte Carlo is reproducible with a seed", () => {
    const a = monte([1, -1, 0], 10, 100, 5);
    const b = monte([1, -1, 0], 10, 100, 5);
    expect(a.median).toBe(b.median);
    expect(a.dd).toBe(b.dd);
  });

  it("parses quoted commas and rule-based R conversion", () => {
    const csv =
      'date,market,session,outcome,planned_rr,entry_tf\n' +
      '2026-01-01,"NQ, Mini",NY,Win,1.5,5M\n' +
      '2026-01-02,NQ,NY,Loss,3,5M';

    const out = parseCSV(csv);

    expect(out.issues.length).toBe(0);
    expect(out.trades[0].market).toBe("NQ, Mini");
    expect(out.trades[0].r).toBe(1.5);
    expect(out.trades[1].r).toBe(-1);
  });

  it("reports invalid rows instead of silently dropping them", () => {
    const out = parseCSV("date,outcome,realised_r\n2026-01-01,Maybe,1");
    expect(out.trades.length).toBe(0);
    expect(out.issues[0].row).toBe(2);
  });

  it("maps break-even labels to zero R", () => {
    const out = parseCSV("date,outcome,planned_rr\n2026-01-01,Break-even,2");
    expect(out.trades[0].outcome).toBe("BE");
    expect(out.trades[0].r).toBe(0);
  });
});
