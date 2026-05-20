"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  Client,
  InventoryRow,
  MarketplaceFilter,
} from "@/lib/mock-data";
import { MARKETPLACES } from "@/lib/mock-data";
import type { SummaryStats } from "@/lib/mock-data";
import SummaryCards from "./SummaryCards";
import InventoryHealthVisual from "./InventoryHealthVisual";
import SafeZoneVisual from "./SafeZoneVisual";
import InboundSummary from "./InboundSummary";
import InventoryTable from "./InventoryTable";
import AddOrderedUnitsModal from "@/components/modals/AddOrderedUnitsModal";
import Update3PLStatusModal from "@/components/modals/Update3PLStatusModal";
import AddInboundOrderModal from "@/components/modals/AddInboundOrderModal";
import { refreshSheetData } from "@/app/actions/refresh-sheet";
import type { InboundOrder } from "@/lib/types";
import Link from "next/link";

type ModalState =
  | { type: null }
  | { type: "add-units"; row: InventoryRow }
  | { type: "update-3pl"; row: InventoryRow }
  | { type: "add-inbound" };

interface DashboardContentProps {
  client: Client;
  inventory: InventoryRow[];
  stats: SummaryStats;
  inboundOrders: InboundOrder[];
}

export default function DashboardContent({
  client,
  inventory,
  stats,
  inboundOrders,
}: DashboardContentProps) {
  const [activeMarketplace, setActiveMarketplace] =
    useState<MarketplaceFilter>("All");
  const [modal, setModal] = useState<ModalState>({ type: null });
  const [isRefreshing, startRefresh] = useTransition();
  const router = useRouter();

  function handleRefresh() {
    startRefresh(async () => {
      await refreshSheetData(client.slug);
      router.refresh();
    });
  }

  return (
    <>
      <div className="pb-16 px-4 md:px-8 max-w-[1440px] mx-auto flex flex-col gap-6 pt-6">
        {/* Page header + marketplace filter */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">
              {client.name}
            </h2>
            <p className="font-body-md text-body-md text-on-surface-variant">
              Inventory Overview &amp; Health Status
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Marketplace filters — show all except "All" as toggles */}
            {MARKETPLACES.filter((m) => m !== "All").map((mp) => (
              <button
                key={mp}
                type="button"
                onClick={() =>
                  setActiveMarketplace(activeMarketplace === mp ? "All" : mp)
                }
                className={`px-4 py-2 rounded-full font-label-md text-label-md transition-colors ${
                  activeMarketplace === mp
                    ? "border-2 border-secondary-container bg-surface-container-low text-primary font-bold"
                    : "border border-outline-variant bg-white text-on-surface hover:bg-surface-container-low"
                }`}
              >
                {mp}
              </button>
            ))}

            {/* Add Inbound Order — visible to all authenticated users */}
            <button
              type="button"
              onClick={() => setModal({ type: "add-inbound" })}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity"
            >
              <span className="material-symbols-outlined text-[18px]">
                add
              </span>
              Add Inbound Order
            </button>

            {/* Manual sheet refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-outline-variant bg-white text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span
                className={`material-symbols-outlined text-[18px] ${isRefreshing ? "animate-spin" : ""}`}
              >
                sync
              </span>
              {isRefreshing ? "Refreshing…" : "Refresh Sheet Data"}
            </button>

            {/* Reorder planning link */}
            <Link
              href={`/dashboard/${client.slug}/reorder`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-outline-variant bg-white text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                shopping_cart
              </span>
              Reorder
            </Link>

            {/* Print report link */}
            <Link
              href={`/dashboard/${client.slug}/print`}
              className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-outline-variant bg-white text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">
                print
              </span>
              Report
            </Link>
          </div>
        </div>

        {/* Summary KPI cards */}
        <SummaryCards stats={stats} clientSlug={client.slug} />

        {/* Bento: Health trend + Safe zone */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InventoryHealthVisual />
          <SafeZoneVisual percentage={client.stockHealth} />
        </div>

        {/* Timeline + Table */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <InboundSummary inventory={inventory} inboundOrders={inboundOrders} />
          <InventoryTable
            rows={inventory}
            activeMarketplace={activeMarketplace}
            onAddUnits={(row) => setModal({ type: "add-units", row })}
            onUpdate3PL={(row) => setModal({ type: "update-3pl", row })}
          />
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-outline-variant bg-surface-container-lowest py-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3 px-4 md:px-8 max-w-[1440px] mx-auto">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Powered by BrandQure © 2026 • Last updated: {client.lastUpdated}
          </p>
          <div className="flex gap-4">
            {["Privacy Policy", "Support", "Terms of Service"].map((link) => (
              <a
                key={link}
                href="#"
                className="font-label-sm text-label-sm text-outline hover:text-primary transition-colors"
              >
                {link}
              </a>
            ))}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {modal.type === "add-units" && (
        <AddOrderedUnitsModal
          row={modal.row}
          inventory={inventory}
          onClose={() => setModal({ type: null })}
        />
      )}
      {modal.type === "update-3pl" && (
        <Update3PLStatusModal
          row={modal.row}
          onClose={() => setModal({ type: null })}
        />
      )}
      {modal.type === "add-inbound" && (
        <AddInboundOrderModal
          clientSlug={client.slug}
          inventory={inventory}
          onClose={() => setModal({ type: null })}
        />
      )}
    </>
  );
}
