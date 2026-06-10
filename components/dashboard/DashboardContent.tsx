"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  Client,
  InventoryRow,
  MarketplaceFilter,
} from "@/lib/mock-data";
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
        {/* Page header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          {/* Title + status */}
          <div>
            <h2 className="font-headline-lg text-headline-lg text-on-surface tracking-tight">
              {client.name}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="font-body-md text-body-md text-on-surface-variant">
                Inventory Overview
              </p>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-label-sm text-label-sm border ${
                client.stockStatus === "Optimal" || client.stockStatus === "Good"
                  ? "border-secondary/25 bg-secondary-fixed/50 text-on-secondary-fixed"
                  : client.stockStatus === "Review"
                  ? "border-[#f59e0b]/30 bg-[#3d1500]/50 text-[#fbbf24]"
                  : "border-error/30 bg-error-container/50 text-on-error-container"
              }`}>
                {client.stockStatus}
              </span>
            </div>
          </div>

          {/* Controls: marketplace filters | divider | action buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            {/* Marketplace filter pills */}
            <div className="flex items-center gap-1.5">
              {client.enabledMarketplaces.map((mp) => (
                <button
                  key={mp}
                  type="button"
                  onClick={() =>
                    setActiveMarketplace(activeMarketplace === mp ? "All" : mp)
                  }
                  className={`px-3 py-1.5 rounded-full font-label-sm text-label-sm transition-all duration-150 ${
                    activeMarketplace === mp
                      ? "border border-secondary-container/70 bg-secondary-fixed/65 text-primary font-semibold backdrop-blur-sm shadow-sm"
                      : "border border-white/[0.09] bg-white/[0.05] text-on-surface-variant hover:bg-white/[0.11] hover:text-on-surface backdrop-blur-sm"
                  }`}
                >
                  {mp}
                </button>
              ))}
            </div>

            {/* Vertical divider */}
            <div className="hidden md:block w-px h-6 bg-outline-variant/30 rounded-full" />

            {/* Primary: Add Inbound Order */}
            <button
              type="button"
              onClick={() => setModal({ type: "add-inbound" })}
              className="btn-primary-indigo"
            >
              <span className="material-symbols-outlined text-[17px]">add</span>
              Add Inbound Order
            </button>

            {/* Secondary: Refresh */}
            <button
              type="button"
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full border border-white/[0.09] bg-white/[0.05] text-on-surface-variant font-label-sm text-label-sm hover:bg-white/[0.11] hover:text-on-surface backdrop-blur-sm shadow-sm transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className={`material-symbols-outlined text-[16px] ${isRefreshing ? "animate-spin" : ""}`}>
                sync
              </span>
              {isRefreshing ? "Refreshing…" : "Refresh"}
            </button>

            {/* Tertiary: Reorder + Report */}
            <div className="flex items-center gap-1">
              <Link
                href={`/dashboard/${client.slug}/reorder`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/[0.09] bg-white/[0.05] text-on-surface-variant font-label-sm text-label-sm hover:bg-white/[0.11] hover:text-on-surface backdrop-blur-sm transition-all duration-150"
              >
                <span className="material-symbols-outlined text-[15px]">shopping_cart</span>
                Reorder
              </Link>
              <Link
                href={`/dashboard/${client.slug}/print`}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full border border-white/[0.09] bg-white/[0.05] text-on-surface-variant font-label-sm text-label-sm hover:bg-white/[0.11] hover:text-on-surface backdrop-blur-sm transition-all duration-150"
              >
                <span className="material-symbols-outlined text-[15px]">print</span>
                Report
              </Link>
            </div>
          </div>
        </div>

        {/* Summary KPI cards */}
        <SummaryCards stats={stats} clientSlug={client.slug} />

        {/* Bento: Health trend + Safe zone */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <InventoryHealthVisual inventory={inventory} />
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
      <footer className="border-t border-white/[0.06] py-6">
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
