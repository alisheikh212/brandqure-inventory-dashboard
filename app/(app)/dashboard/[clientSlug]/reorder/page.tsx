import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getClientConfig } from "@/lib/clients";
import { getInventoryFromSheet } from "@/lib/sheets";
import { sortByReorderUrgency } from "@/lib/reorder";
import ReorderTable from "@/components/reorder/ReorderTable";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clientSlug: string }>;
}

export default async function ReorderPage({ params }: PageProps) {
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
  const inventory = await getInventoryFromSheet(clientConfig);
  const sorted = sortByReorderUrgency(inventory);

  const lastUpdated = inventory.reduce(
    (latest, row) => (row.lastUpdated > latest ? row.lastUpdated : latest),
    "",
  );

  return (
    <main className="flex-1 px-4 md:px-8 py-8 max-w-[1440px] mx-auto w-full">
      {/* Page header */}
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
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
              Reorder Planning
            </span>
          </div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            Reorder Planning
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant mt-1">
            Quantities ensure 60 days of coverage after your next shipment
            arrives.{" "}
            <span className="font-semibold text-on-surface">
              Current FBA stock and inbound units are credited
            </span>{" "}
            so you only order what is actually missing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Default Lead Time
            </p>
            <p className="font-numeric-data text-numeric-data text-on-surface">
              {clientConfig.defaultLeadTimeDays} days
            </p>
          </div>
          <div className="w-px h-8 bg-outline-variant" />
          <div className="flex flex-col items-end">
            <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
              Last Updated
            </p>
            <p className="font-label-md text-label-md text-on-surface">
              {lastUpdated || "—"}
            </p>
          </div>
          <Link
            href={`/dashboard/${clientSlug}/print`}
            className="flex items-center gap-1.5 px-4 py-2 rounded-full border border-outline-variant bg-white text-on-surface font-label-md text-label-md hover:bg-surface-container-low transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">print</span>
            Report
          </Link>
        </div>
      </div>

      {/* Reorder Table */}
      <ReorderTable rows={sorted} />

      {/* Footer note */}
      <div className="mt-8 p-4 bg-surface-container rounded-lg border border-outline-variant">
        <p className="font-label-md text-label-md text-on-surface-variant flex items-start gap-2">
          <span className="material-symbols-outlined text-[18px] text-outline mt-0.5 flex-shrink-0">
            info
          </span>
          Recommended quantities are calculated as{" "}
          <strong className="text-on-surface mx-1">
            (lead time + 60 days) × daily sales rate − current FBA − inbound
          </strong>
          , floored at zero. This ensures 60 days of coverage after your next
          shipment arrives, without over-ordering stock you already have. Adjust
          quantities based on supplier minimums, freight consolidation, or
          seasonal demand.
        </p>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-outline-variant">
        <div className="flex flex-col md:flex-row justify-between items-center gap-3">
          <p className="font-label-sm text-label-sm text-on-surface-variant">
            Powered by BrandQure © 2026
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
    </main>
  );
}
