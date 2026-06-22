import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientConfig } from "@/lib/clients";
import { getInventoryFromSheet } from "@/lib/sheets";
import { computeSummaryStats } from "@/lib/reorder";
import { getPendingInboundOrders } from "@/app/actions/inbound-orders";
import type { Client, StockStatus, InventoryRow, Marketplace } from "@/lib/mock-data";
import { normalizeMarketplace } from "@/lib/mock-data";

const VALID_MARKETPLACE_SET = new Set<string>(["Amazon.com", "Amazon.ca", "Amazon UK", "Shopify", "Walmart"]);
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
    // Normalize Supabase strings ("Amazon.com", legacy "Amazon USA", etc.) to canonical Marketplace values.
    // Filter to only values in the known set so unknown strings are dropped safely.
    enabledMarketplaces: config.enabledMarketplaces
      .map(normalizeMarketplace)
      .filter((m): m is Marketplace => VALID_MARKETPLACE_SET.has(m)),
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
