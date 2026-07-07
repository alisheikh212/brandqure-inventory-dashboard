import { describe, it, expect } from "vitest";
import {
  splitIntoBatches,
  computeBatchDispatchPlan,
  buildBatchExportCSV,
  addDays,
  fmtDate,
  type BatchDispatchInputs,
} from "../batch-dispatch";

// ─── Helpers ───────────────────────────────────────────────────

const BASE_DATE = new Date("2026-07-07T00:00:00.000Z");

function makeInputs(overrides: Partial<BatchDispatchInputs> = {}): BatchDispatchInputs {
  return {
    totalOrderQuantity: 300,
    numberOfBatches: 3,
    avgDailySales: 5,
    eligibleInventory: 100,
    leadTimeDays: 30,
    handoffBufferDays: 8,
    transitDays: undefined,
    planningStartDate: BASE_DATE,
    ...overrides,
  };
}

// ─── 1. splitIntoBatches ───────────────────────────────────────

describe("splitIntoBatches", () => {
  it("splits evenly with no remainder", () => {
    expect(splitIntoBatches(90, 3)).toEqual([30, 30, 30]);
  });

  it("distributes remainder to earliest batches", () => {
    // 10 / 3 = 3 r 1 → [4, 3, 3]
    expect(splitIntoBatches(10, 3)).toEqual([4, 3, 3]);
    // 7 / 3 = 2 r 1 → [3, 2, 2]
    expect(splitIntoBatches(7, 3)).toEqual([3, 2, 2]);
  });

  it("distributes remainder across multiple early batches", () => {
    // 11 / 4 = 2 r 3 → [3, 3, 3, 2]
    expect(splitIntoBatches(11, 4)).toEqual([3, 3, 3, 2]);
  });

  it("handles n=1 as identity", () => {
    expect(splitIntoBatches(150, 1)).toEqual([150]);
  });

  it("returns zeros for total=0", () => {
    expect(splitIntoBatches(0, 3)).toEqual([0, 0, 0]);
  });

  it("sum always equals total", () => {
    for (const [total, n] of [[100, 3], [999, 4], [1, 2], [50, 1]] as const) {
      const result = splitIntoBatches(total, n);
      const sum = result.reduce((a, b) => a + b, 0);
      expect(sum).toBe(total);
    }
  });
});

// ─── 2. Early guard: zero order quantity ──────────────────────

describe("computeBatchDispatchPlan — zero order quantity", () => {
  it("returns empty batches and a warning when totalOrderQuantity is 0", () => {
    const result = computeBatchDispatchPlan(makeInputs({ totalOrderQuantity: 0 }));
    expect(result.batches).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].code).toBe("zero_order_quantity");
  });
});

// ─── 3. Early guard: zero avg daily sales ─────────────────────

describe("computeBatchDispatchPlan — zero avg daily sales", () => {
  it("returns empty batches and a warning when avgDailySales is 0", () => {
    const result = computeBatchDispatchPlan(makeInputs({ avgDailySales: 0 }));
    expect(result.batches).toHaveLength(0);
    expect(result.warnings).toHaveLength(1);
    expect(result.warnings[0].code).toBe("zero_avg_daily_sales");
  });
});

// ─── 4. Early guard: batch count exceeds quantity ─────────────

describe("computeBatchDispatchPlan — batch count exceeds quantity", () => {
  it("returns empty batches when numberOfBatches > totalOrderQuantity", () => {
    const result = computeBatchDispatchPlan(
      makeInputs({ totalOrderQuantity: 2, numberOfBatches: 3 }),
    );
    expect(result.batches).toHaveLength(0);
    const codes = result.warnings.map((w) => w.code);
    expect(codes).toContain("batch_count_exceeds_quantity");
  });
});

// ─── 5. Correct number of batches produced ────────────────────

describe("computeBatchDispatchPlan — batch count", () => {
  it("produces exactly n batches", () => {
    for (const n of [1, 2, 3, 4] as const) {
      const result = computeBatchDispatchPlan(makeInputs({ numberOfBatches: n }));
      expect(result.batches).toHaveLength(n);
    }
  });

  it("batch quantities sum to totalOrderQuantity", () => {
    const result = computeBatchDispatchPlan(makeInputs());
    const total = result.batches.reduce((s, b) => s + b.quantity, 0);
    expect(total).toBe(300);
  });
});

// ─── 6. Arrival dates are non-decreasing ──────────────────────

describe("computeBatchDispatchPlan — arrival date ordering", () => {
  it("each batch arrives after the previous one", () => {
    const result = computeBatchDispatchPlan(makeInputs({ numberOfBatches: 4 }));
    for (let i = 1; i < result.batches.length; i++) {
      expect(result.batches[i].targetArrivalDate.getTime()).toBeGreaterThan(
        result.batches[i - 1].targetArrivalDate.getTime(),
      );
    }
  });
});

// ─── 7. Stockout risk detection ───────────────────────────────

describe("computeBatchDispatchPlan — stockout risk", () => {
  it("flags stockout risk when eligible inventory depletes before first arrival", () => {
    // avgDailySales=10, eligibleInventory=10 → stock lasts 1 day
    // leadTimeDays=30 → earliest first arrival is 30 days out
    // desiredFirstArrival = 1 - 8 = -7 days → before earliestPossible
    const result = computeBatchDispatchPlan(
      makeInputs({
        eligibleInventory: 10,
        avgDailySales: 10,
        leadTimeDays: 30,
        handoffBufferDays: 8,
      }),
    );
    expect(result.summary.hasStockoutRisk).toBe(true);
    expect(result.summary.stockoutGapDays).toBeGreaterThan(0);
    const codes = result.warnings.map((w) => w.code);
    expect(codes).toContain("stockout_risk");
  });

  it("does not flag stockout risk when inventory covers until first arrival", () => {
    // eligibleInventory=500, avgDailySales=5 → 100 days coverage
    // leadTimeDays=30 → desiredFirstArrival = 100-8 = 92 days out ≥ 30
    const result = computeBatchDispatchPlan(
      makeInputs({ eligibleInventory: 500, avgDailySales: 5, leadTimeDays: 30 }),
    );
    expect(result.summary.hasStockoutRisk).toBe(false);
  });
});

// ─── 8. Dispatch dates when transitDays provided ─────────────

describe("computeBatchDispatchPlan — dispatch dates", () => {
  it("sets dispatchDate = arrivalDate - transitDays when transitDays provided", () => {
    const transit = 14;
    const result = computeBatchDispatchPlan(makeInputs({ transitDays: transit }));
    for (const batch of result.batches) {
      expect(batch.dispatchDate).not.toBeNull();
      const expectedDispatch = addDays(batch.targetArrivalDate, -transit);
      expect(batch.dispatchDate!.getTime()).toBe(expectedDispatch.getTime());
    }
  });

  it("dispatchDate is null when transitDays is not provided", () => {
    const result = computeBatchDispatchPlan(makeInputs({ transitDays: undefined }));
    for (const batch of result.batches) {
      expect(batch.dispatchDate).toBeNull();
    }
  });
});

// ─── 9. Summary fields ────────────────────────────────────────

describe("computeBatchDispatchPlan — summary", () => {
  it("totalForecastCoverage equals sum of each batch's coverageDays", () => {
    const result = computeBatchDispatchPlan(makeInputs());
    const expected = result.batches.reduce((s, b) => s + b.coverageDays, 0);
    expect(result.summary.totalForecastCoverage).toBeCloseTo(expected, 5);
  });

  it("firstArrivalDate matches batch[0].targetArrivalDate", () => {
    const result = computeBatchDispatchPlan(makeInputs());
    expect(result.summary.firstArrivalDate?.getTime()).toBe(
      result.batches[0].targetArrivalDate.getTime(),
    );
  });

  it("finalArrivalDate matches last batch's targetArrivalDate", () => {
    const result = computeBatchDispatchPlan(makeInputs({ numberOfBatches: 3 }));
    const last = result.batches[result.batches.length - 1];
    expect(result.summary.finalArrivalDate?.getTime()).toBe(
      last.targetArrivalDate.getTime(),
    );
  });
});

// ─── 10. CSV export ───────────────────────────────────────────

describe("buildBatchExportCSV", () => {
  it("includes batch count and handoff buffer in output", () => {
    const inputs = makeInputs({ numberOfBatches: 2, handoffBufferDays: 10 });
    const result = computeBatchDispatchPlan(inputs);
    const csv = buildBatchExportCSV(result, inputs);
    expect(csv).toContain("Batch count,2");
    expect(csv).toContain("Handoff buffer days,10");
  });

  it("includes a row for each batch", () => {
    const inputs = makeInputs({ numberOfBatches: 3 });
    const result = computeBatchDispatchPlan(inputs);
    const csv = buildBatchExportCSV(result, inputs);
    for (let i = 1; i <= 3; i++) {
      expect(csv).toContain(`${i},`);
    }
  });

  it("notes 'Transit time required' when transitDays not provided", () => {
    const inputs = makeInputs({ transitDays: undefined });
    const result = computeBatchDispatchPlan(inputs);
    const csv = buildBatchExportCSV(result, inputs);
    expect(csv).toContain("Transit time required");
  });

  it("includes supplier storage note", () => {
    const inputs = makeInputs();
    const result = computeBatchDispatchPlan(inputs);
    const csv = buildBatchExportCSV(result, inputs);
    expect(csv).toContain("supplier");
  });
});

// ─── Extra: fmtDate ───────────────────────────────────────────

describe("fmtDate", () => {
  it("formats a date as a readable string", () => {
    const d = new Date("2026-01-15T12:00:00.000Z");
    const s = fmtDate(d);
    expect(s).toContain("2026");
    expect(s).toMatch(/Jan|15/);
  });
});
