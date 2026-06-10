"use client";

import Link from "next/link";
import type { InboundOrder } from "@/lib/types";

// ── Types ─────────────────────────────────────────────────────────────────────

interface ShipmentGroup {
  expectedArrivalDate: string;
  orders: InboundOrder[];
  skus: { sku: string; productName: string; quantity: number }[];
  totalUnits: number;
  progress: number; // 0–1
  daysRemaining: number;
  status: "in-transit" | "buffer" | "expired";
  statusLabel: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function groupOrders(orders: InboundOrder[]): ShipmentGroup[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const map = new Map<string, InboundOrder[]>();
  for (const order of orders) {
    const arr = map.get(order.expectedArrivalDate) ?? [];
    arr.push(order);
    map.set(order.expectedArrivalDate, arr);
  }

  return Array.from(map.entries())
    .map(([date, grpOrders]) => {
      const earliestCreatedAt = grpOrders.reduce(
        (min, o) => (o.createdAt < min ? o.createdAt : min),
        grpOrders[0].createdAt,
      );

      const startDate = new Date(earliestCreatedAt);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(0, 0, 0, 0);

      const bufferEnd = new Date(endDate);
      bufferEnd.setDate(bufferEnd.getDate() + 10);

      const totalMs = endDate.getTime() - startDate.getTime();
      const elapsedMs = today.getTime() - startDate.getTime();
      const progress =
        totalMs > 0 ? Math.max(0, Math.min(1, elapsedMs / totalMs)) : 1;

      const daysRemaining = Math.round(
        (endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24),
      );

      let status: ShipmentGroup["status"];
      let statusLabel: string;
      if (today <= endDate) {
        status = "in-transit";
        statusLabel = "In transit";
      } else if (today <= bufferEnd) {
        status = "buffer";
        statusLabel = "In buffer period";
      } else {
        status = "expired";
        statusLabel = "Expired from reorder planning";
      }

      // Aggregate quantities per SKU within this group
      const skuMap = new Map<
        string,
        { sku: string; productName: string; quantity: number }
      >();
      for (const o of grpOrders) {
        const existing = skuMap.get(o.sku);
        if (existing) {
          existing.quantity += o.quantity;
        } else {
          skuMap.set(o.sku, {
            sku: o.sku,
            productName: o.productName,
            quantity: o.quantity,
          });
        }
      }

      const skus = Array.from(skuMap.values());
      const totalUnits = skus.reduce((sum, s) => sum + s.quantity, 0);

      return {
        expectedArrivalDate: date,
        orders: grpOrders,
        skus,
        totalUnits,
        progress,
        daysRemaining,
        status,
        statusLabel,
      };
    })
    .sort((a, b) => a.expectedArrivalDate.localeCompare(b.expectedArrivalDate));
}

function bezierPoint(
  t: number,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
): { x: number; y: number } {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * cx + t * t * x1,
    y: mt * mt * y0 + 2 * mt * t * cy + t * t * y1,
  };
}

function bezierAngleDeg(
  t: number,
  x0: number,
  y0: number,
  cx: number,
  cy: number,
  x1: number,
  y1: number,
): number {
  const mt = 1 - t;
  const dx = 2 * mt * (cx - x0) + 2 * t * (x1 - cx);
  const dy = 2 * mt * (cy - y0) + 2 * t * (y1 - cy);
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

// ── SVG layout constants ───────────────────────────────────────────────────────

const SVG_W = 900;
const ORIGIN_X = 70;
const FBA_X = 830;
const CTRL_X = SVG_W / 2;
const CTRL_DY = -55; // control point lifts this many px above the track centre
const TRACK_BASE_Y = 85;
const TRACK_SPACING = 100;
const CARD_W = 158;
const CARD_H = 90;
const PLANE_SIZE = 26;

// ── Map SVG sub-component ──────────────────────────────────────────────────────

function MapSVG({ groups }: { groups: ShipmentGroup[] }) {
  const activeGroups = groups.filter((g) => g.status !== "expired");
  const numTracks = Math.max(1, activeGroups.length);
  const svgH = Math.max(180, TRACK_BASE_Y + numTracks * TRACK_SPACING + 40);

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${svgH}`}
      className="w-full"
      aria-hidden="true"
      style={{ overflow: "visible" }}
    >
      {/* Abstract dot-grid background */}
      {Array.from({ length: 7 }, (_, row) =>
        Array.from({ length: 19 }, (_, col) => (
          <circle
            key={`dot-${row}-${col}`}
            cx={col * 50 + 25}
            cy={row * 44 + 22}
            r="1.5"
            fill="rgba(99,102,241,0.10)"
          />
        )),
      )}

      {/* "FBA Warehouse" label — anchored once at the top */}
      {activeGroups.length > 0 && (
        <text
          x={FBA_X}
          y={TRACK_BASE_Y - 26}
          textAnchor="middle"
          fontSize="10"
          fill="rgba(16,185,129,0.85)"
          fontFamily="system-ui, -apple-system, sans-serif"
          fontWeight="600"
          letterSpacing="0.3"
        >
          FBA Warehouse
        </text>
      )}

      {activeGroups.length === 0 ? (
        <text
          x={SVG_W / 2}
          y={svgH / 2}
          textAnchor="middle"
          dominantBaseline="middle"
          fill="rgba(0,0,0,0.28)"
          fontSize="14"
          fontFamily="system-ui, -apple-system, sans-serif"
        >
          No active shipments on route
        </text>
      ) : (
        activeGroups.map((group, i) => {
          const trackY = TRACK_BASE_Y + i * TRACK_SPACING;
          const ctrlY = trackY + CTRL_DY;

          // Cap visual position so plane doesn&apos;t stack on the FBA icon during buffer
          const vt = group.status === "buffer" ? 0.97 : group.progress;
          const { x: px, y: py } = bezierPoint(
            vt,
            ORIGIN_X,
            trackY,
            CTRL_X,
            ctrlY,
            FBA_X,
            trackY,
          );
          const angle = bezierAngleDeg(
            vt,
            ORIGIN_X,
            trackY,
            CTRL_X,
            ctrlY,
            FBA_X,
            trackY,
          );

          // Card: right of plane in first half of route, left in second half
          let cardX =
            vt < 0.55
              ? px + PLANE_SIZE / 2 + 8
              : px - PLANE_SIZE / 2 - 8 - CARD_W;
          let cardY = py - CARD_H / 2;
          cardX = Math.max(4, Math.min(SVG_W - CARD_W - 4, cardX));
          cardY = Math.max(4, Math.min(svgH - CARD_H - 4, cardY));

          const isBuffer = group.status === "buffer";
          const accentColor = isBuffer
            ? "rgba(217,119,6,0.85)"
            : "rgba(99,102,241,0.85)";

          return (
            <g key={group.expectedArrivalDate}>
              {/* Dashed route line */}
              <path
                d={`M ${ORIGIN_X},${trackY} Q ${CTRL_X},${ctrlY} ${FBA_X},${trackY}`}
                fill="none"
                stroke="rgba(99,102,241,0.22)"
                strokeWidth="1.5"
                strokeDasharray="6 4"
              />

              {/* Origin dot */}
              <circle
                cx={ORIGIN_X}
                cy={trackY}
                r="8"
                fill="rgba(99,102,241,0.10)"
              />
              <circle
                cx={ORIGIN_X}
                cy={trackY}
                r="4"
                fill="rgba(99,102,241,0.55)"
              />

              {/* FBA warehouse box */}
              <rect
                x={FBA_X - 20}
                y={trackY - 15}
                width="40"
                height="30"
                rx="7"
                fill="rgba(16,185,129,0.10)"
                stroke="rgba(16,185,129,0.38)"
                strokeWidth="1.5"
              />
              <text
                x={FBA_X}
                y={trackY + 1}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="rgba(16,185,129,0.85)"
                fontSize="9"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, sans-serif"
                letterSpacing="0.5"
              >
                FBA
              </text>

              {/* Multi-track label near origin */}
              {activeGroups.length > 1 && (
                <text
                  x={ORIGIN_X + 15}
                  y={trackY + 4}
                  fontSize="9"
                  fill="rgba(99,102,241,0.55)"
                  fontFamily="system-ui, -apple-system, sans-serif"
                >
                  #{i + 1}
                </text>
              )}

              {/* Animated plane */}
              <g
                className="animate-float-plane"
                style={{ transformOrigin: `${px}px ${py}px` }}
              >
                <foreignObject
                  x={px - PLANE_SIZE / 2}
                  y={py - PLANE_SIZE / 2}
                  width={PLANE_SIZE}
                  height={PLANE_SIZE}
                >
                  <div
                    style={{
                      width: PLANE_SIZE,
                      height: PLANE_SIZE,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      transform: `rotate(${angle}deg)`,
                    }}
                  >
                    <span
                      className="material-symbols-outlined"
                      style={{
                        fontSize: `${PLANE_SIZE - 2}px`,
                        color: accentColor,
                        lineHeight: 1,
                      }}
                    >
                      flight_takeoff
                    </span>
                  </div>
                </foreignObject>
              </g>

              {/* Floating info card */}
              <foreignObject x={cardX} y={cardY} width={CARD_W} height={CARD_H}>
                <div
                  style={{
                    background: "rgba(255,255,255,0.90)",
                    backdropFilter: "blur(14px)",
                    WebkitBackdropFilter: "blur(14px)",
                    border: "1px solid rgba(255,255,255,0.72)",
                    borderRadius: "12px",
                    boxShadow:
                      "0 4px 16px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
                    padding: "8px 10px",
                    width: CARD_W,
                    height: CARD_H,
                    overflow: "hidden",
                    boxSizing: "border-box",
                  }}
                >
                  {/* Arrival date */}
                  <p
                    style={{
                      fontFamily: "system-ui, -apple-system, sans-serif",
                      fontSize: "10px",
                      fontWeight: 600,
                      color: "rgba(20,20,40,0.82)",
                      margin: 0,
                      marginBottom: 3,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {formatDate(group.expectedArrivalDate)}
                  </p>

                  {/* SKU lines (max 2) */}
                  {group.skus.slice(0, 2).map((sku) => (
                    <p
                      key={sku.sku}
                      style={{
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontSize: "9.5px",
                        color: "rgba(60,60,80,0.88)",
                        margin: 0,
                        marginBottom: 2,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <span style={{ fontWeight: 600 }}>{sku.sku}</span>
                      {" · "}
                      {sku.quantity.toLocaleString()} units
                    </p>
                  ))}
                  {group.skus.length > 2 && (
                    <p
                      style={{
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontSize: "9px",
                        color: "rgba(120,120,140,0.75)",
                        margin: 0,
                        marginBottom: 2,
                      }}
                    >
                      +{group.skus.length - 2} more SKU
                      {group.skus.length > 3 ? "s" : ""}
                    </p>
                  )}

                  {/* Progress + status */}
                  <div
                    style={{
                      marginTop: 5,
                      paddingTop: 5,
                      borderTop: "1px solid rgba(0,0,0,0.07)",
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontSize: "10.5px",
                        fontWeight: 700,
                        color: accentColor,
                      }}
                    >
                      {Math.round(group.progress * 100)}%
                    </span>
                    <span
                      style={{ color: "rgba(0,0,0,0.20)", fontSize: "9px" }}
                    >
                      ·
                    </span>
                    <span
                      style={{
                        fontFamily: "system-ui, -apple-system, sans-serif",
                        fontSize: "9.5px",
                        color: isBuffer
                          ? "rgba(161,98,7,0.9)"
                          : "rgba(79,82,200,0.9)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        flex: 1,
                      }}
                    >
                      {group.statusLabel}
                    </span>
                  </div>
                </div>
              </foreignObject>
            </g>
          );
        })
      )}
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

interface Props {
  inboundOrders: InboundOrder[];
  clientSlug: string;
}

export default function InboundJourneyMap({
  inboundOrders,
  clientSlug,
}: Props) {
  const groups = groupOrders(inboundOrders);
  const activeGroups = groups.filter((g) => g.status !== "expired");
  const expiredGroups = groups.filter((g) => g.status === "expired");
  const allTableGroups = [...activeGroups, ...expiredGroups];

  return (
    <main className="flex-1 px-4 md:px-8 py-8 max-w-[1440px] mx-auto w-full">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <Link
            href={`/dashboard/${clientSlug}`}
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            Dashboard
          </Link>
          <span className="text-outline">/</span>
          <span className="font-label-md text-label-md text-on-surface">
            Inbound Journey
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-[30px] text-primary">
            flight_takeoff
          </span>
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              Inbound Journey
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant mt-0.5">
              Track active inbound shipments moving toward FBA.
            </p>
          </div>
        </div>
      </div>

      {inboundOrders.length === 0 ? (
        /* ── Empty state ── */
        <div className="glass-panel flex flex-col items-center justify-center gap-5 py-24 text-center px-6">
          <span className="material-symbols-outlined text-[56px] text-outline">
            flight_land
          </span>
          <div>
            <p className="font-headline-sm text-headline-sm text-on-surface">
              No active inbound shipments yet.
            </p>
            <p className="font-body-md text-body-md text-on-surface-variant mt-1 max-w-md mx-auto">
              Create an inbound order from the dashboard to start tracking
              shipments here.
            </p>
          </div>
          <Link
            href={`/dashboard/${clientSlug}`}
            className="flex items-center gap-1.5 px-5 py-2.5 rounded-full border border-outline-variant bg-white text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Go to Dashboard
          </Link>
        </div>
      ) : (
        <>
          {/* ── Map card ── */}
          <div className="glass-panel overflow-visible mb-6">
            <div className="px-5 py-4 border-b border-white/40 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">
                map
              </span>
              <h3 className="font-label-lg text-label-lg text-on-surface">
                Flight Map
              </h3>
              {activeGroups.length > 0 && (
                <span className="ml-auto font-label-sm text-label-sm text-secondary bg-secondary-fixed/60 border border-secondary/20 px-2 py-0.5 rounded-full">
                  {activeGroups.length} shipment
                  {activeGroups.length !== 1 ? "s" : ""} in flight
                </span>
              )}
            </div>

            {activeGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-2 py-12 text-center px-6">
                <span className="material-symbols-outlined text-[40px] text-outline">
                  check_circle
                </span>
                <p className="font-body-md text-body-md text-on-surface-variant">
                  All shipments have passed their expected arrival date.
                </p>
              </div>
            ) : (
              <div className="px-4 py-6 md:px-8 md:py-8">
                <MapSVG groups={groups} />

                {/* Legend */}
                <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 justify-end">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[rgba(99,102,241,0.6)]" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Origin
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-sm border border-[rgba(16,185,129,0.5)] bg-[rgba(16,185,129,0.15)]" />
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      FBA Warehouse
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[14px] text-primary">
                      flight_takeoff
                    </span>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">
                      Active shipment
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ── Shipment table ── */}
          <div className="glass-panel overflow-hidden">
            <div className="px-5 py-4 border-b border-white/40 flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">
                table_rows
              </span>
              <h3 className="font-label-lg text-label-lg text-on-surface">
                All Inbound Shipments
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant/30 bg-white/20">
                    <th className="px-5 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      SKUs
                    </th>
                    <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                      Total Units
                    </th>
                    <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Expected Arrival
                    </th>
                    <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                      Days Remaining
                    </th>
                    <th className="px-4 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider text-right">
                      Progress
                    </th>
                    <th className="px-5 py-3 font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/20">
                  {allTableGroups.map((group) => {
                    const isExpired = group.status === "expired";
                    const isBuffer = group.status === "buffer";

                    const statusPillClass = isExpired
                      ? "bg-surface-container text-outline border border-outline-variant/30"
                      : isBuffer
                        ? "bg-[#fef3c7] text-[#92400e] border border-[#fbbf24]/40"
                        : "bg-secondary-fixed/60 text-on-secondary-fixed border border-secondary/20";

                    const statusIcon = isExpired
                      ? "block"
                      : isBuffer
                        ? "hourglass_bottom"
                        : "flight_takeoff";

                    return (
                      <tr
                        key={group.expectedArrivalDate}
                        className={
                          isExpired
                            ? "opacity-55 bg-white/10"
                            : "bg-transparent hover:bg-white/30 transition-colors"
                        }
                      >
                        {/* SKUs */}
                        <td className="px-5 py-3 max-w-[240px]">
                          {group.skus.map((s) => (
                            <p
                              key={s.sku}
                              className="font-label-sm text-label-sm text-on-surface truncate"
                              title={s.productName}
                            >
                              <span className="font-semibold">{s.sku}</span>
                              <span className="text-on-surface-variant">
                                {" "}
                                – {s.productName}
                              </span>
                            </p>
                          ))}
                        </td>

                        {/* Total units */}
                        <td className="px-4 py-3 text-right font-numeric-data text-numeric-data text-on-surface">
                          {group.totalUnits.toLocaleString()}
                        </td>

                        {/* Expected arrival */}
                        <td className="px-4 py-3 font-label-md text-label-md text-on-surface whitespace-nowrap">
                          {formatDate(group.expectedArrivalDate)}
                        </td>

                        {/* Days remaining */}
                        <td className="px-4 py-3 text-right font-numeric-data text-numeric-data">
                          {isExpired ? (
                            <span className="text-outline">—</span>
                          ) : group.daysRemaining < 0 ? (
                            <span className="text-[#92400e]">
                              {group.daysRemaining}d
                            </span>
                          ) : (
                            <span className="text-on-surface">
                              {group.daysRemaining}d
                            </span>
                          )}
                        </td>

                        {/* Progress bar */}
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-20 h-1.5 rounded-full bg-outline-variant/30 overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all ${
                                  isExpired
                                    ? "bg-outline/40"
                                    : isBuffer
                                      ? "bg-[#f59e0b]"
                                      : "bg-primary"
                                }`}
                                style={{
                                  width: `${Math.round(group.progress * 100)}%`,
                                }}
                              />
                            </div>
                            <span className="font-label-sm text-label-sm text-on-surface-variant w-9 text-right tabular-nums">
                              {Math.round(group.progress * 100)}%
                            </span>
                          </div>
                        </td>

                        {/* Status badge */}
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm ${statusPillClass}`}
                          >
                            <span className="material-symbols-outlined text-[11px]">
                              {statusIcon}
                            </span>
                            {group.statusLabel}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Table footer note */}
            <div className="px-5 py-3 border-t border-outline-variant/25">
              <p className="font-label-sm text-label-sm text-on-surface-variant">
                Progress = elapsed / total journey time · Buffer period = up to
                10 days past expected arrival · Expired orders remain for
                history but are no longer credited in reorder planning
              </p>
            </div>
          </div>
        </>
      )}
    </main>
  );
}
