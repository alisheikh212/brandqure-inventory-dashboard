import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientConfig } from "@/lib/clients";
import { getInventoryFromSheet } from "@/lib/sheets";
import { computeSummaryStats } from "@/lib/reorder";
import { getPendingInboundOrders } from "@/app/actions/inbound-orders";
import type { Client, StockStatus, InventoryRow } from "@/lib/mock-data";
import { normalizeEnabledMarketplaces } from "@/lib/marketplace-utils";
import type { ClientConfig } from "@/lib/clients";
import type { SummaryStats } from "@/lib/mock-data";
import DashboardContent from "@/components/dashboard/DashboardContent";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clientSlug: string }>;
}

function toClientShape(
  config: ClientConfig,
  stats: SummaryStats,
  inventory: InventoryRow[],
): Client {
  const lastUpdated = inventory.reduce(
    (latest, row) => (row.lastUpdated > latest ? row.lastUpdated : latest),
    "",
  );

  const stockStatus: StockStatus =
    stats.healthScore > 85
      ? "Optimal"
      : stats.healthScore > 70
        ? "Good"
        : stats.healthScore > 50
          ? "Review"
          : "Critical";

  return {
    id: config.clientSlug,
    slug: config.clientSlug,
    name: config.clientName,
    tier: config.tier as Client["tier"],
    logoInitial: config.logoInitial,
    activeSKUs: stats.totalActiveSKUs,
    stockHealth: stats.healthScore,
    stockStatus,
    defaultLeadTimeDays: config.defaultLeadTimeDays,
    lastUpdated: lastUpdated || new Date().toISOString().split("T")[0],
    // Normalize to canonical marketplace IDs (e.g. "amazon.co.uk") and dedupe.
    // Unknown/unrecognised values are preserved, never dropped — a client with
    // a marketplace outside the built-in catalog should still see it listed
    // rather than have it silently vanish (this previously caused Solens's
    // ["amazon.co.uk"] to become an empty array).
    enabledMarketplaces: normalizeEnabledMarketplaces(config.enabledMarketplaces),
  };
}

export default async function DashboardPage({ params }: PageProps) {
  const { clientSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Client users can only view their own dashboard
  if (user?.app_metadata?.role === "client") {
    const allowedSlug = user.app_metadata?.clientSlug;
    if (allowedSlug && allowedSlug !== clientSlug) {
      redirect(`/dashboard/${allowedSlug}`);
    }
  }

  const clientConfig = await getClientConfig(clientSlug);
  if (!clientConfig) notFound();

  // Throws on failure — propagates to error.tsx boundary. No mock fallback.
  const [inventory, inboundOrders] = await Promise.all([
    getInventoryFromSheet(clientConfig),
    getPendingInboundOrders(clientSlug),
  ]);

  const stats = computeSummaryStats(inventory);
  const client = toClientShape(clientConfig, stats, inventory);

  return (
    <DashboardContent
      client={client}
      inventory={inventory}
      stats={stats}
      inboundOrders={inboundOrders}
    />
  );
}
