export type Trade = {
  date: string;
  market: string;
  session: string;
  outcome: string;
  r: number;
  tf: string;
};

export type ParseIssue = { row: number; message: string };
export type ParseResult = { trades: Trade[]; issues: ParseIssue[] };

export function maxDD(values: number[]) {
  let cumulative = 0;
  let peak = 0;
  let maxDrawdown = 0;

  for (const value of values) {
    cumulative += value;
    peak = Math.max(peak, cumulative);
    maxDrawdown = Math.min(maxDrawdown, cumulative - peak);
  }

  return maxDrawdown;
}

export function rollingMean(values: number[], window: number) {
  return values.map((_, i) => ({
    i: i + 1,
    value:
      i + 1 < window
        ? null
        : +(
            values
              .slice(Math.max(0, i - window + 1), i + 1)
              .reduce((a, b) => a + b, 0) / Math.min(window, i + 1)
          ).toFixed(3),
  }));
}

export function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function bootstrap(values: number[], n = 10_000, seed = 7) {
  if (!values.length) return { lo: 0, mid: 0, hi: 0 };

  const rng = seeded(seed);
  const means: number[] = [];

  for (let i = 0; i < n; i++) {
    let sum = 0;
    for (let j = 0; j < values.length; j++) {
      sum += values[Math.floor(rng() * values.length)];
    }
    means.push(sum / values.length);
  }

  means.sort((a, b) => a - b);
  const q = (p: number) => means[Math.floor((means.length - 1) * p)];

  return { lo: q(0.025), mid: q(0.5), hi: q(0.975) };
}

export function monte(values: number[], horizon = 100, n = 3000, seed = 42) {
  if (!values.length) {
    return { p05: 0, median: 0, p95: 0, dd: 0, severe: 0, belowZero: 0 };
  }

  const rng = seeded(seed);
  const endings: number[] = [];
  const drawdowns: number[] = [];

  for (let i = 0; i < n; i++) {
    let cumulative = 0;
    let peak = 0;
    let maxDrawdown = 0;

    for (let j = 0; j < horizon; j++) {
      cumulative += values[Math.floor(rng() * values.length)];
      peak = Math.max(peak, cumulative);
      maxDrawdown = Math.min(maxDrawdown, cumulative - peak);
    }

    endings.push(cumulative);
    drawdowns.push(maxDrawdown);
  }

  const sortedEndings = [...endings].sort((a, b) => a - b);
  const sortedDrawdowns = [...drawdowns].sort((a, b) => a - b);
  const q = (arr: number[], p: number) => arr[Math.floor((arr.length - 1) * p)];

  return {
    p05: q(sortedEndings, 0.05),
    median: q(sortedEndings, 0.5),
    p95: q(sortedEndings, 0.95),
    dd: q(sortedDrawdowns, 0.5),
    severe: q(sortedDrawdowns, 0.05),
    belowZero: endings.filter((x) => x < 0).length / n,
  };
}

function splitCsvLine(line: string) {
  const cells: string[] = [];
  let current = "";
  let quoted = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];

    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        quoted = !quoted;
      }
    } else if (ch === "," && !quoted) {
      cells.push(current.trim());
      current = "";
    } else {
      current += ch;
    }
  }

  cells.push(current.trim());
  return cells;
}

export function parseCSV(text: string): ParseResult {
  const lines = text
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line, i) => i === 0 || line.trim() !== "");

  if (lines.length < 2) throw new Error("CSV has no trade rows");

  const headers = splitCsvLine(lines[0]).map((x) => x.trim().toLowerCase());
  const idx = (...names: string[]) => headers.findIndex((h) => names.includes(h));

  const dateIndex = idx("date");
  const marketIndex = idx("market");
  const sessionIndex = idx("session");
  const outcomeIndex = idx("outcome");
  const realisedIndex = idx("realised_r", "realized_r", "r");
  const plannedIndex = idx("planned_rr", "r/r", "rr");
  const tfIndex = idx("entry_tf", "timeframe", "tf");

  if (dateIndex < 0 || outcomeIndex < 0 || (realisedIndex < 0 && plannedIndex < 0)) {
    throw new Error("Required columns: date, outcome, and realised_r (or planned_rr)");
  }

  const trades: Trade[] = [];
  const issues: ParseIssue[] = [];

  lines.slice(1).forEach((line, i) => {
    const row = i + 2;
    const cells = splitCsvLine(line);
    const rawOutcome = (cells[outcomeIndex] || "").trim();

    if (!cells[dateIndex]) {
      issues.push({ row, message: "Missing date" });
      return;
    }

    let outcome = "";
    if (/break|\bbe\b/i.test(rawOutcome)) outcome = "BE";
    else if (/win/i.test(rawOutcome)) outcome = "Win";
    else if (/loss/i.test(rawOutcome)) outcome = "Loss";
    else {
      issues.push({ row, message: `Unrecognised outcome: ${rawOutcome || "(blank)"}` });
      return;
    }

    let r = realisedIndex >= 0 ? Number(cells[realisedIndex]) : Number.NaN;

    if (!Number.isFinite(r)) {
      const planned = Number(cells[plannedIndex]);
      if (outcome === "Win" && Number.isFinite(planned)) r = planned;
      else if (outcome === "Loss") r = -1;
      else if (outcome === "BE") r = 0;
    }

    if (!Number.isFinite(r)) {
      issues.push({ row, message: "Could not derive realised R" });
      return;
    }

    trades.push({
      date: cells[dateIndex].trim(),
      market: marketIndex >= 0 ? (cells[marketIndex] || "—").trim() || "—" : "—",
      session: sessionIndex >= 0 ? (cells[sessionIndex] || "—").trim() || "—" : "—",
      outcome,
      r,
      tf: tfIndex >= 0 ? (cells[tfIndex] || "—").trim() || "—" : "—",
    });
  });

  return { trades, issues };
}
