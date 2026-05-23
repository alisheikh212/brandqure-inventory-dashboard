import type { InventoryRow } from "@/lib/mock-data";
import type { InboundOrder } from "@/lib/types";

interface InboundSummaryProps {
  inventory: InventoryRow[];
  inboundOrders: InboundOrder[];
}

const MARKETPLACE_COLORS: Record<string, string> = {
  "Amazon USA": "bg-[#fff3e0] text-[#e65100]",
  "Amazon Canada": "bg-[#e8f5e9] text-[#1b5e20]",
  Shopify: "bg-[#f3e5f5] text-[#4a148c]",
  Walmart: "bg-[#e3f2fd] text-[#0d47a1]",
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

  const hasSheetInbound = sheetInbound.length > 0;
  const hasOrders = inboundOrders.length > 0;
  const isEmpty = !hasSheetInbound && !hasOrders;

  return (
    <div className="glass-panel lg:col-span-1 overflow-hidden flex flex-col h-[480px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/40 flex items-center gap-2">
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

          {/* Tracked Orders (Supabase) — shown first, with countdown */}
          {hasOrders && (
            <div>
              <div className="px-5 py-2 bg-white/30 border-b border-white/35">
                <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                  Tracked Orders
                </p>
              </div>
              <ul className="divide-y divide-outline-variant/25">
                {inboundOrders.map((order) => {
                  const days = daysFromToday(order.expectedArrivalDate);
                  const isOverdue = days < 0;
                  const isToday = days === 0;
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
                        {/* Countdown badge */}
                        <span
                          className={`flex-shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-label-sm text-label-sm ${
                            isOverdue
                              ? "bg-error-container text-error"
                              : isToday
                              ? "bg-[#e8f5e9] text-[#1b5e20]"
                              : "bg-surface-container text-on-surface-variant"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px]">
                            {isOverdue ? "warning" : "schedule"}
                          </span>
                          {isOverdue
                            ? `${Math.abs(days)}d overdue`
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

          {/* Sheet Inbound (Google Sheets col F) — no dates */}
          {hasSheetInbound && (
            <div>
              <div className="px-5 py-2 bg-white/30 border-b border-white/35">
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

      {/* Footer */}
      <div className="px-5 py-3 border-t border-white/40">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          {hasOrders && !hasSheetInbound
            ? "Tracked Orders from app · Sheet Inbound from Google Sheets"
            : hasOrders && hasSheetInbound
            ? "Tracked Orders with countdown · Sheet Inbound from Google Sheets"
            : "Based on Google Sheets data"}
        </p>
      </div>
    </div>
  );
}
