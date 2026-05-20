import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAllClientConfigs } from "@/lib/clients";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Only admin users may access this page
  const role = user?.app_metadata?.role;
  if (role !== "admin") {
    // Client users go to their own dashboard; any other role goes to login
    const slug = user?.app_metadata?.clientSlug;
    redirect(role === "client" && slug ? `/dashboard/${slug}` : "/login");
  }

  const clients = await getAllClientConfigs();

  return (
    <main className="flex-1 px-4 md:px-8 py-8 max-w-[1440px] mx-auto w-full">
      {/* Page header */}
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h2 className="font-headline-lg text-headline-lg text-on-surface mb-1">
            Select a Client to Manage
          </h2>
          <p className="font-body-md text-body-md text-on-surface-variant">
            Switch between active accounts to manage inventory and view reports.
          </p>
        </div>
        <Link
          href="/admin/clients/new"
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-on-primary font-label-md text-label-md hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Add Client
        </Link>
      </div>

      {/* Search (decorative for Phase 1) */}
      <div className="relative max-w-sm mb-8">
        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px] pointer-events-none">
          search
        </span>
        <input
          type="text"
          placeholder="Search clients..."
          readOnly
          className="w-full pl-10 pr-4 py-2 border border-outline-variant rounded-lg bg-white font-body-md text-body-md placeholder:text-outline focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        />
      </div>

      {/* Client Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {clients.map((client) => (
          <div
            key={client.clientSlug}
            className="bg-white rounded-xl border border-outline-variant card-shadow flex flex-col relative overflow-hidden"
          >
            {/* Accent bar top */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-on-tertiary-fixed-variant to-secondary-container" />

            {/* Clickable dashboard link area */}
            <Link
              href={`/dashboard/${client.clientSlug}`}
              className="p-6 flex flex-col flex-1 group cursor-pointer"
            >
              {/* Client identity */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-surface-container-high flex items-center justify-center flex-shrink-0">
                    <span className="font-headline-md text-headline-md text-on-surface-variant">
                      {client.logoInitial}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-headline-md text-headline-md text-on-surface">
                      {client.clientName}
                    </h3>
                    <p className="font-label-sm text-label-sm text-on-surface-variant mt-0.5">
                      {client.tier} Tier
                    </p>
                  </div>
                </div>
                <span className="material-symbols-outlined text-outline group-hover:text-primary transition-colors">
                  arrow_forward
                </span>
              </div>

              {/* Static config stats */}
              <div className="grid grid-cols-2 gap-4 border-t border-surface-variant pt-4">
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Default Lead Time
                  </p>
                  <p className="font-numeric-data text-numeric-data text-on-surface mt-1">
                    {client.defaultLeadTimeDays}d
                  </p>
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                    Marketplaces
                  </p>
                  <p className="font-numeric-data text-numeric-data text-on-surface mt-1">
                    {client.enabledMarketplaces.length}
                  </p>
                </div>
              </div>
            </Link>

            {/* Admin action strip */}
            <div className="flex items-center gap-2 px-6 py-3 border-t border-surface-variant bg-surface-container/40">
              <Link
                href={`/admin/clients/${client.clientSlug}/edit`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">edit</span>
                Edit
              </Link>
              <Link
                href={`/admin/clients/${client.clientSlug}/users/new`}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-outline-variant font-label-sm text-label-sm text-on-surface-variant hover:border-primary hover:text-primary transition-colors"
              >
                <span className="material-symbols-outlined text-[14px]">person_add</span>
                Create Login
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <footer className="mt-16 pt-6 border-t border-outline-variant">
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
