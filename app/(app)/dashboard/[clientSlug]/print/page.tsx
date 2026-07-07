import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getClientConfig } from "@/lib/clients";
import { getInventoryFromSheet } from "@/lib/sheets";
import {
  computeSummaryStats,
  recommendedReorderQty,
  buildActiveInboundMap,
  sortByReorderUrgency,
  getReorderStatus,
} from "@/lib/reorder";
import { InventoryStatusBadge } from "@/components/ui/StatusBadge";
import PrintButton from "@/components/print/PrintButton";
import { getPendingInboundOrders } from "@/app/actions/inbound-orders";
import { getMarketplaceLabel } from "@/lib/marketplace-utils";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clientSlug: string }>;
}

const REPORT_DATE = new Date().toLocaleDateString("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

export default async function PrintReportPage({ params }: PageProps) {
  const { clientSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user?.app_metadata?.role === "client") {
    const allowedSlug = user.app_metadata?.clientSlug;
    if (allowedSlug && allowedSlug !== clientSlug) {
      redirect(`/dashboard/${allowedSlug}/print`);
    }
  }

  const clientConfig = await getClientConfig(clientSlug);
  if (!clientConfig) notFound();

  // Parallel fetch — same pattern as dashboard and reorder pages.
  // getPendingInboundOrders is non-fatal (returns [] on error).
  const [inventory, inboundOrders] = await Promise.all([
    getInventoryFromSheet(clientConfig),
    getPendingInboundOrders(clientSlug),
  ]);

  const stats = computeSummaryStats(inventory);

  // Build SKU → active app-inbound quantity map (credits orders within the
  // 10-day post-arrival buffer, same logic as the reorder planning page).
  const activeInboundMap = buildActiveInboundMap(inboundOrders);

  // Sort by reorder urgency so the most critical SKUs appear first in the PDF.
  const sortedInventory = sortByReorderUrgency(inventory);

  const client = {
    name: clientConfig.clientName,
    slug: clientConfig.clientSlug,
    defaultLeadTimeDays: clientConfig.defaultLeadTimeDays,
  };

  const warehouseCapacity = 84;

  return (
    /* report-wrapper: flattened to white with no padding in @media print */
    <div className="report-wrapper bg-surface-container min-h-screen py-8 print:py-0 print:bg-white">

      {/* Screen-only controls — hidden in print via print-hidden */}
      <div className="max-w-[1200px] mx-auto mb-4 flex items-center justify-between px-4 print-hidden">
        <Link
          href={`/dashboard/${client.slug}`}
          className="flex items-center gap-2 font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">
            arrow_back
          </span>
          Back to Dashboard
        </Link>
        <PrintButton />
      </div>

      {/*
        report-doc:
          Screen — max-w-[1200px] gives the table room to breathe
          Print  — report-doc CSS overrides to max-width:100%, padding:0
                   so content fills the full printable area (@page margins apply)
      */}
      <div className="report-doc max-w-[1200px] min-h-[1056px] print:min-h-0 mx-auto bg-surface-container-lowest print:shadow-none shadow-xl flex flex-col print:flex-none relative px-10 pt-10 pb-8 print:px-0 print:pt-0 print:pb-0 border border-outline-variant print:border-none">

        {/* Report Header */}
        <header className="report-section flex justify-between items-end border-b-2 border-primary pb-6 mb-8">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 text-primary">
              <span
                className="material-symbols-outlined text-3xl fill"
                style={{ fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }}
              >
                dashboard_customize
              </span>
              <span className="font-headline-md text-headline-md uppercase tracking-wide">
                BrandQure
              </span>
            </div>
            <h1 className="font-headline-lg text-headline-lg text-on-surface mt-1">
              Inventory Command Center
            </h1>
            <h2 className="font-headline-md text-headline-md text-on-surface-variant">
              Status Report — {client.name}
            </h2>
          </div>
          <div className="text-right flex flex-col gap-1 text-on-surface-variant">
            <span className="font-label-md text-label-md uppercase tracking-widest text-outline">
              Report Date
            </span>
            <span className="font-numeric-data text-numeric-data">{REPORT_DATE}</span>
            <span className="font-label-sm text-label-sm mt-2">
              ID: REP-883A-91X
            </span>
          </div>
        </header>

        {/* Executive Summary */}
        <section className="report-section mb-10">
          <h3 className="report-heading font-headline-md text-headline-md text-on-surface mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">subject</span>
            Executive Summary
          </h3>
          <div className="bg-surface p-6 rounded border border-outline-variant">
            <p className="font-body-md text-body-md text-on-surface-variant leading-relaxed">
              This document provides a high-level overview of the current operational
              inventory status for <strong className="text-on-surface">{client.name}</strong>{" "}
              across all active regions. Total holding capacity remains stable at{" "}
              {warehouseCapacity}%, with no immediate critical logistical blockages
              detected. However, specific high-velocity SKUs require immediate
              procurement review to prevent potential stockouts in the upcoming quarter.
              Default lead time for this account is{" "}
              <strong className="text-on-surface">{client.defaultLeadTimeDays} days</strong>.
            </p>
          </div>
        </section>

        {/* System Health Metrics */}
        <section className="report-section mb-10">
          <h3 className="report-heading font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">monitoring</span>
            System Health &amp; Metrics
          </h3>
          <div className="grid grid-cols-3 gap-6">
            {/* Total Active SKUs */}
            <div className="report-kpi border border-outline-variant p-5 rounded flex flex-col gap-2 bg-surface-container-lowest">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Total Active SKUs
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="font-display-lg text-display-lg text-primary">
                  {stats.totalActiveSKUs}
                </span>
                <span className="font-label-sm text-label-sm text-secondary bg-surface-variant px-2 py-1 rounded mb-2">
                  {stats.skuTrend.split(" ")[0]}
                </span>
              </div>
            </div>

            {/* Critical Low Stock */}
            <div className="report-kpi border border-outline-variant p-5 rounded flex flex-col gap-2 bg-surface-container-lowest">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Reorder Now
              </span>
              <div className="flex items-end justify-between mt-2">
                <span className="font-display-lg text-display-lg text-error">
                  {stats.reorderNow}
                </span>
                <span className="font-label-sm text-label-sm text-error bg-error-container px-2 py-1 rounded mb-2">
                  Needs Action
                </span>
              </div>
            </div>

            {/* Warehouse Capacity */}
            <div className="report-kpi border border-outline-variant p-5 rounded flex flex-col justify-between bg-surface-container-lowest">
              <span className="font-label-md text-label-md text-on-surface-variant uppercase tracking-wider">
                Warehouse Capacity
              </span>
              <div className="mt-4">
                <div className="flex justify-between mb-1">
                  <span className="font-numeric-data text-numeric-data text-primary">
                    {warehouseCapacity}%
                  </span>
                  <span className="font-label-sm text-label-sm text-outline">
                    Zone A–C
                  </span>
                </div>
                <div className="w-full bg-surface-container h-2 rounded-full overflow-hidden border border-outline-variant">
                  <div
                    className="bg-primary h-full rounded-full"
                    style={{ width: `${warehouseCapacity}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Priority Inventory Audit — allowed to flow across pages */}
        <section className="report-section-flow flex-grow print:flex-none mb-12 print:mb-0">
          <h3 className="report-heading font-headline-md text-headline-md text-on-surface mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-outline">
              table_chart
            </span>
            Priority Inventory Audit
          </h3>

          {/*
            report-table-wrap:
              Screen — overflow-x-auto allows horizontal scroll on very small viewports
              Print  — CSS switches to overflow:visible + table-layout:fixed + thead repeat
          */}
          <div className="report-table-wrap w-full overflow-x-auto border border-outline-variant rounded">
            <table className="w-full text-left border-collapse">
              {/*
                <colgroup> fixes column widths when table-layout:fixed kicks in at print.
                8 columns. Product absorbs word-wrap; numeric cols stay narrow.
                Widths sum to 100%.
              */}
              <colgroup>
                <col style={{ width: "10%" }} />{/* SKU */}
                <col style={{ width: "20%" }} />{/* Product */}
                <col style={{ width: "11%" }} />{/* Marketplace */}
                <col style={{ width: "9%" }} /> {/* FBA Avail */}
                <col style={{ width: "8%" }} />  {/* Inbound */}
                <col style={{ width: "8%" }} />  {/* Reserved */}
                <col style={{ width: "12%" }} />{/* Status */}
                <col style={{ width: "22%" }} />{/* Units to Order */}
              </colgroup>
              <thead>
                <tr className="bg-surface text-on-surface-variant font-label-md text-label-md border-b-2 border-outline">
                  {[
                    "SKU",
                    "Product",
                    "Marketplace",
                    "FBA Avail",
                    "Inbound",
                    "Reserved",
                    "Status",
                    "Units to Order",
                  ].map((col) => (
                    <th key={col} className="py-3 px-4 uppercase tracking-wider">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="font-body-md text-body-md text-on-surface">
                {sortedInventory.map((row) => {
                  const activeAppQty = activeInboundMap.get(row.sku) ?? 0;
                  const reorderQty = recommendedReorderQty(row, activeAppQty);
                  const reorderStatus = getReorderStatus(row);

                  return (
                    <tr
                      key={row.id}
                      className={`border-b border-outline-variant ${
                        row.status === "Out of Stock" || row.status === "Critical Low"
                          ? "bg-error-container/10"
                          : ""
                      }`}
                    >
                      <td className="py-3 px-4 font-numeric-data text-sm">
                        {row.sku}
                      </td>
                      <td className="py-3 px-4 font-semibold text-sm">
                        {row.productName}
                      </td>
                      <td className="py-3 px-4 text-on-surface-variant text-sm">
                        {getMarketplaceLabel(row.marketplace)}
                      </td>
                      <td
                        className={`py-3 px-4 text-right font-numeric-data text-sm ${
                          row.fbaAvailable === 0 ? "text-error" : ""
                        }`}
                      >
                        {row.fbaAvailable.toLocaleString()}
                      </td>
                      <td className="py-3 px-4 text-right font-numeric-data text-sm text-secondary">
                        {row.inboundUnits > 0
                          ? `+${row.inboundUnits.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="py-3 px-4 text-right font-numeric-data text-sm text-outline">
                        {row.reservedUnits.toLocaleString()}
                      </td>
                      <td className="py-3 px-4">
                        <InventoryStatusBadge status={row.status} />
                      </td>
                      <td className="py-3 px-4 text-right font-numeric-data text-sm">
                        {reorderQty === 0 ? (
                          <span className="text-outline">—</span>
                        ) : reorderStatus === "Reorder Now" ? (
                          <span className="font-bold text-error">
                            {reorderQty.toLocaleString()}
                          </span>
                        ) : reorderStatus === "Reorder Soon" ? (
                          <span className="font-semibold text-[#b45309]">
                            {reorderQty.toLocaleString()}
                          </span>
                        ) : (
                          <span>{reorderQty.toLocaleString()}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Formula footnote — print-friendly */}
          <p className="mt-3 font-label-sm text-label-sm text-on-surface-variant leading-snug">
            Units to Order = max(0, ceil(avg daily sales × (lead time + 60 days))
            &minus; FBA available &minus; reserved units &minus; sheet inbound &minus; active app inbound).
            Reserved units are treated as FBA-side stock. Active app inbound credited within 10-day post-arrival buffer.
            Rows sorted by urgency.
          </p>
        </section>

        {/* Document Footer */}
        <footer className="bg-surface-container-lowest text-on-surface-variant font-label-sm text-label-sm w-full py-6 mt-auto print:mt-8 border-t border-outline-variant flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="font-label-md text-label-md font-semibold text-primary">
              BrandQure
            </span>
            <span className="text-outline">|</span>
            <span>Powered by BrandQure © 2026 • Generated on System Time</span>
          </div>
          <div className="flex gap-4">
            {["Privacy Policy", "Support", "Terms of Service"].map((link) => (
              <a
                key={link}
                href="#"
                className="text-outline hover:text-primary transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </footer>
      </div>
    </div>
  );
}
