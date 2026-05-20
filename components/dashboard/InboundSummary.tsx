import type { InventoryRow } from "@/lib/mock-data";

interface InboundSummaryProps {
  inventory: InventoryRow[];
}

const MARKETPLACE_COLORS: Record<string, string> = {
  "Amazon USA": "bg-[#fff3e0] text-[#e65100]",
  "Amazon Canada": "bg-[#e8f5e9] text-[#1b5e20]",
  Shopify: "bg-[#f3e5f5] text-[#4a148c]",
  Walmart: "bg-[#e3f2fd] text-[#0d47a1]",
};

export default function InboundSummary({ inventory }: InboundSummaryProps) {
  const inboundRows = inventory
    .filter((row) => row.inboundUnits > 0)
    .sort((a, b) => b.inboundUnits - a.inboundUnits);

  return (
    <div className="bg-white rounded-2xl border border-outline-variant shadow-sm lg:col-span-1 overflow-hidden flex flex-col h-[480px]">
      {/* Header */}
      <div className="px-5 py-4 border-b border-outline-variant flex items-center gap-2">
        <span className="material-symbols-outlined text-[20px] text-primary">
          move_to_inbox
        </span>
        <h3 className="font-label-lg text-label-lg text-on-surface">
          Inbound Summary
        </h3>
      </div>

      {inboundRows.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center gap-2 px-5 text-center">
          <span className="material-symbols-outlined text-[40px] text-outline">
            inbox
          </span>
          <p className="font-body-md text-body-md text-on-surface-variant">
            No inbound units currently recorded.
          </p>
        </div>
      ) : (
        <ul className="flex-1 overflow-y-auto divide-y divide-outline-variant">
          {inboundRows.map((row) => {
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
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full font-label-sm text-label-sm ${pillClass}`}
                  >
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
      )}

      {/* Footer note */}
      <div className="px-5 py-3 border-t border-outline-variant">
        <p className="font-label-sm text-label-sm text-on-surface-variant">
          Based on Google Sheets data · Arrival dates tracked in Phase 3C
        </p>
      </div>
    </div>
  );
}
