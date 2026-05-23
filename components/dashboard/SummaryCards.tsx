import Link from "next/link";
import type { SummaryStats } from "@/lib/mock-data";

interface SummaryCardsProps {
  stats: SummaryStats;
  clientSlug: string;
}

function IconBubble({
  icon,
  bgClass,
  iconClass,
}: {
  icon: string;
  bgClass: string;
  iconClass: string;
}) {
  return (
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${bgClass}`}>
      <span className={`material-symbols-outlined text-[20px] ${iconClass}`}>
        {icon}
      </span>
    </div>
  );
}

export default function SummaryCards({ stats, clientSlug }: SummaryCardsProps) {
  const healthBarColor =
    stats.healthScore >= 80
      ? "bg-secondary"
      : stats.healthScore >= 60
        ? "bg-[#f59e0b]"
        : "bg-error";

  const healthLabel =
    stats.healthScore >= 80
      ? "Good standing"
      : stats.healthScore >= 60
        ? "Needs attention"
        : "Action required";

  const healthLabelColor =
    stats.healthScore >= 80
      ? "text-secondary"
      : stats.healthScore >= 60
        ? "text-[#b45309]"
        : "text-error";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">

      {/* Active SKUs */}
      <div className="glass-panel p-7 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Active SKUs
          </p>
          <IconBubble
            icon="inventory"
            bgClass="bg-surface-container-high"
            iconClass="text-on-surface-variant"
          />
        </div>
        <div>
          <p className="font-display-lg text-display-lg text-on-surface leading-none">
            {stats.totalActiveSKUs.toLocaleString()}
          </p>
          <span className="inline-block mt-3 px-2.5 py-1 rounded-full bg-secondary-fixed font-label-sm text-label-sm text-on-secondary-fixed">
            {stats.skuTrend}
          </span>
        </div>
      </div>

      {/* SKUs Needing Reorder */}
      <Link
        href={`/dashboard/${clientSlug}/reorder`}
        className="glass-panel p-7 flex flex-col gap-5 hover:shadow-[0_8px_32px_-4px_rgba(17,28,45,0.14),0_2px_8px_rgba(17,28,45,0.07)] hover:-translate-y-0.5 transition-all duration-200 group cursor-pointer"
      >
        <div className="flex items-start justify-between">
          <p className="font-label-md text-label-md text-on-surface-variant">
            SKUs Needing Reorder
          </p>
          <IconBubble
            icon="shopping_cart"
            bgClass="bg-[#fff8ed]"
            iconClass="text-[#b45309]"
          />
        </div>
        <div>
          <p className="font-display-lg text-display-lg text-on-surface leading-none">
            {stats.reorderNow}
          </p>
          <p className="mt-3 font-label-sm text-label-sm text-[#b45309]">
            {stats.reorderSoon > 0
              ? `+${stats.reorderSoon} more due soon`
              : "All others in safe zone"}
          </p>
          <p className="mt-1 font-label-sm text-label-sm text-outline group-hover:text-primary transition-colors">
            View reorder plan →
          </p>
        </div>
      </Link>

      {/* Units Inbound */}
      <div className="glass-panel p-7 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Units Inbound
          </p>
          <IconBubble
            icon="local_shipping"
            bgClass="bg-secondary-fixed"
            iconClass="text-on-secondary-fixed"
          />
        </div>
        <div>
          <p className="font-display-lg text-display-lg text-on-surface leading-none">
            {stats.inTransit.toLocaleString()}
          </p>
          <p className="mt-3 font-label-sm text-label-sm text-secondary">
            En route to FBA
          </p>
        </div>
      </div>

      {/* Inventory Health */}
      <div className="glass-panel p-7 flex flex-col gap-5">
        <div className="flex items-start justify-between">
          <p className="font-label-md text-label-md text-on-surface-variant">
            Inventory Health
          </p>
          <IconBubble
            icon="verified"
            bgClass={stats.healthScore >= 60 ? "bg-secondary-fixed" : "bg-error-container"}
            iconClass={stats.healthScore >= 60 ? "text-on-secondary-fixed" : "text-error"}
          />
        </div>
        <div>
          <p className="font-display-lg text-display-lg text-on-surface leading-none">
            {stats.healthScore}%
          </p>
          {/* Mini health bar */}
          <div className="mt-3 w-full bg-white/50 border border-white/40 h-1.5 rounded-full overflow-hidden">
            <div
              className={`${healthBarColor} h-full rounded-full transition-all`}
              style={{ width: `${stats.healthScore}%` }}
            />
          </div>
          <p className={`mt-2 font-label-sm text-label-sm ${healthLabelColor}`}>
            {healthLabel}
          </p>
        </div>
      </div>

    </div>
  );
}
