import type { InventoryRow } from "@/lib/mock-data";
import type { InboundOrder } from "@/lib/types";
import { isActiveInboundOrder } from "@/lib/reorder";

interface InboundSummaryProps {
  inventory: InventoryRow[];
  inboundOrders: InboundOrder[];
}

const MARKETPLACE_COLORS: Record<string, string> = {
  "Amazon.com": "bg-[#3d1000]/70 text-[#fb923c]",
  "Amazon.ca":  "bg-[#0a2d0a]/70 text-[#4ade80]",
  "Amazon UK":  "bg-[#0d1a3d]/70 text-[#93c5fd]",
  "Shopify":    "bg-[#2d0a3d]/70 text-[#d8b4fe]",
  "Walmart":    "bg-[#0a1e3d]/70 text-[#7dd3fc]",
};

function daysFromToday(dateStr: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const arrival = new Date(dateStr);
  arrival.setHours(0, 0, 0, 0);
  return Math.round((arrival.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
}

export default function InboundSummary({ inventory, inboundOrders }: InboundSummaryProps) {
  const sheetInbound = inventory
    .filter((row) => row.inboundUnits > 0)
    .sort((a, b) => b.inboundUnits - a.inboundUnits);

  // Split app orders into active (counting in formula) and expired (history only).
  // Active = isActiveInboundOrder() → today ≤ expectedArrivalDate + 10 days
  // Expired = past that buffer — still shown for history but not in reorder math
  const activeOrders = inboundOrders.filter((o) => isActiveInboundOrder(o));
  const expiredOrders = inboundOrders.filter((o) => !isActiveInboundOrder(o));

  const hasSheetInbound = sheetInbound.length > 0;
  const hasActiveOrders = activeOrders.length > 0;
  const hasExpiredOrders = expiredOrders.length > 0;
  const isEmpty = !hasSheetInbound && !hasActiveOrders && !hasExpiredOrders;

  return (
    <div className="glass-panel lg:col-span-1 overflow-hidden flex flex-col h-[480px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.07] flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary">
          move_to_inbox
        </span>
        <h3 className="font-label-lg text-label-lg text-on-surface">
          Inbound Summary
        </h3>
      </div>

      {isEmpty ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-5 text-center">
          <span className="material-symbols-outlined text-[40px] text-outline">
            inbox
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            No inbound units currently recorded.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">

          {/* Active App-Created Orders — counting in reorder formula */}
          {hasActiveOrders && (
            <div>
              <div className="px-5 py-2 bg-[#1d1d1d]/40 border-b border-white/[0.06] flex items-center gap-2">
                <span className="material-symbols-outlined text-[13px] text-secondary">
                  check_circle
                </span>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Active App Orders
                </p>
                <span className="ml-auto font-label-sm text-label-sm text-secondary bg-secondary-fixed/60 border border-secondary/20 px-1.5 py-0.5 rounded-full">
                  Credited in reorder
                </span>
              </div>
              <ul className="divide-y divide-outline-variant/25">
                {activeOrders.map((order) => {
                  const days = daysFromToday(order.expectedArrivalDate);
                  const isToday = days === 0;
                  // Past arrival but within 10-day buffer = "In buffer period"
                  const isInBuffer = days < 0;
                  const pillClass = MARKETPLACE_COLORS[order.marketplace] ?? "bg-surface-container text-on-surface-variant";

                  return (
                    <li key={order.id} className="px-5 py-3 flex flex-col gap-1">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="font-label-md text-label-md text-on-surface truncate flex-1"
                          title={order.productName}
                        >
                          {order.productName}
                        </p>
                        {/* Status badge */}
                        <span
                          className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                            isInBuffer
                              ? "bg-[#3d1500]/60 text-[#fbbf24] border border-[#fbbf24]/30"
                              : isToday
                              ? "bg-[#003d1a]/60 text-[#4ade80]"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {isInBuffer ? "hourglass_bottom" : "schedule"}
                          </span>
                          {isInBuffer
                            ? "In buffer period"
                            : isToday
                            ? "Today"
                            : `${days}d`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-label-sm text-label-sm ${pillClass}`}>
                          {order.marketplace}
                        </span>
                        <span className="font-numeric-data text-numeric-data text-primary">
                          {order.quantity.toLocaleString()} units
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          · est. {new Date(order.expectedArrivalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Expired App Orders — past buffer, no longer in reorder formula */}
          {hasExpiredOrders && (
            <div>
              <div className="px-5 py-2 bg-[#1a1a1a]/30 border-b border-white/[0.05] flex items-center gap-2">
                <span className="material-symbols-outlined text-[13px] text-outline">
                  history
                </span>
                <p className="font-label-sm text-label-sm text-outline uppercase tracking-wider">
                  Past Orders
                </p>
                <span className="ml-auto font-label-sm text-label-sm text-outline bg-[#282828]/80 border border-white/[0.08] px-1.5 py-0.5 rounded-full">
                  Not in reorder
                </span>
              </div>
              <ul className="divide-y divide-outline-variant/15">
                {expiredOrders.map((order) => {
                  const pillClass = MARKETPLACE_COLORS[order.marketplace] ?? "bg-surface-container text-on-surface-variant";
                  return (
                    <li key={order.id} className="px-5 py-3 flex flex-col gap-1 opacity-60">
                      <div className="flex items-start justify-between gap-2">
                        <p
                          className="font-label-md text-label-md text-on-surface-variant truncate flex-1"
                          title={order.productName}
                        >
                          {order.productName}
                        </p>
                        <span className="flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm bg-surface-container text-outline border border-outline-variant/30">
                          <span className="material-symbols-outlined text-[12px]">
                            block
                          </span>
                          Expired from reorder
                        </span>
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-label-sm text-label-sm ${pillClass}`}>
                          {order.marketplace}
                        </span>
                        <span className="font-numeric-data text-numeric-data text-on-surface-variant">
                          {order.quantity.toLocaleString()} units
                        </span>
                        <span className="font-label-sm text-label-sm text-outline">
                          · est. {new Date(order.expectedArrivalDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Sheet Inbound (Google Sheets col F) — no dates */}
          {hasSheetInbound && (
            <div>
              <div className="px-5 py-2 bg-[#1d1d1d]/40 border-b border-white/[0.06] flex items-center gap-2">
                <span className="material-symbols-outlined text-[13px] text-secondary">
                  table_chart
                </span>
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Sheet Inbound
                </p>
              </div>
              <ul className="divide-y divide-outline-variant/25">
                {sheetInbound.map((row) => {
                  const pillClass =
                    MARKETPLACE_COLORS[row.marketplace] ??
                    "bg-surface-container text-on-surface-variant";
                  return (
                    <li key={row.id} className="px-5 py-3 flex flex-col gap-1">
                      <p
                        className="font-label-md text-label-md text-on-surface truncate"
                        title={row.productName}
                      >
                        {row.productName}
                      </p>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`inline-block px-2 py-0.5 rounded-full font-label-sm text-label-sm ${pillClass}`}>
                          {row.marketplace}
                        </span>
                        <span className="font-numeric-data text-numeric-data text-primary">
                          {row.inboundUnits.toLocaleString()} inbound
                        </span>
                        <span className="font-label-sm text-label-sm text-on-surface-variant">
                          · {row.fbaAvailable.toLocaleString()} FBA
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </div>
      )}

    </div>
  );
}
