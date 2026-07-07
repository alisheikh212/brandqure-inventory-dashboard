import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getClientConfig } from "@/lib/clients";
import { getInventoryFromSheet } from "@/lib/sheets";
import HistoricForecastClient from "@/components/historic-forecast/HistoricForecastClient";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clientSlug: string }>;
}

export default async function HistoricForecastPage({ params }: PageProps) {
  const { clientSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Client users can only view their own historic forecast
  if (user?.app_metadata?.role === "client") {
    const allowedSlug = user.app_metadata?.clientSlug;
    if (allowedSlug && allowedSlug !== clientSlug) {
      redirect(`/dashboard/${allowedSlug}/historic-forecast`);
    }
  }

  const clientConfig = await getClientConfig(clientSlug);
  if (!clientConfig) notFound();

  // Reuse the cached sheet fetch — same data source as the dashboard.
  // Throws on failure → propagates to error.tsx.
  const inventory = await getInventoryFromSheet(clientConfig);

  return (
    <main className="flex-1 px-4 md:px-8 py-8 max-w-[1440px] mx-auto w-full">
      {/* Page header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Link
            href={`/dashboard/${clientSlug}`}
            className="font-label-md text-label-md text-on-surface-variant hover:text-primary transition-colors flex items-center gap-1"
          >
            <span className="material-symbols-outlined text-[16px]">
              arrow_back
            </span>
            {clientConfig.clientName}
          </Link>
          <span className="text-outline">/</span>
          <span className="font-label-md text-label-md text-on-surface">
            Historic Forecast
          </span>
        </div>
        <h2 className="font-headline-lg text-headline-lg text-on-surface">
          Historic Forecast
        </h2>
        <p className="font-body-md text-body-md text-on-surface-variant mt-1">
          Upload a Sellerboard P&amp;L export to calculate a reorder quantity
          from your actual historical monthly sales velocity.
        </p>
      </div>

      <HistoricForecastClient
        inventory={inventory}
        clientSlug={clientSlug}
        clientName={clientConfig.clientName}
        defaultLeadTimeDays={clientConfig.defaultLeadTimeDays}
      />
    </main>
  );
}
