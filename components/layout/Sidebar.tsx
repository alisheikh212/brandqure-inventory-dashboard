"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  role: string;
  name: string;
  initials: string;
  collapsed: boolean;
}

export default function Sidebar({
  role,
  name,
  initials,
  collapsed,
}: SidebarProps) {
  const pathname = usePathname();

  const parts = pathname.split("/");
  const clientSlug =
    parts[1] === "dashboard" && parts[2] ? parts[2] : null;

  const dashboardHref = clientSlug ? `/dashboard/${clientSlug}` : "/admin";
  const reorderHref = clientSlug ? `/dashboard/${clientSlug}/reorder` : "/admin";
  const reportHref = clientSlug ? `/dashboard/${clientSlug}/print` : "/admin";
  const inboundMapHref = clientSlug ? `/dashboard/${clientSlug}/inbound-map` : "/admin";
  const historicForecastHref = clientSlug ? `/dashboard/${clientSlug}/historic-forecast` : "/admin";

  const isActive = (match: string) => {
    if (match === "admin") return pathname === "/admin";
    if (match === "reorder") return pathname.endsWith("/reorder");
    if (match === "print") return pathname.endsWith("/print");
    if (match === "inbound-map") return pathname.endsWith("/inbound-map");
    if (match === "historic-forecast") return pathname.endsWith("/historic-forecast");
    if (match === "dashboard")
      return (
        pathname.startsWith("/dashboard") &&
        !pathname.endsWith("/reorder") &&
        !pathname.endsWith("/print") &&
        !pathname.endsWith("/inbound-map") &&
        !pathname.endsWith("/historic-forecast")
      );
    return false;
  };

  const navItems = [
    {
      label: "Dashboard",
      icon: "dashboard",
      href: dashboardHref,
      match: "dashboard",
    },
    {
      label: "Reorder Planning",
      icon: "shopping_cart",
      href: reorderHref,
      match: "reorder",
    },
    {
      label: "Reports",
      icon: "analytics",
      href: reportHref,
      match: "print",
    },
    {
      label: "Inbound Journey",
      icon: "flight_takeoff",
      href: inboundMapHref,
      match: "inbound-map",
    },
    {
      label: "Historic Forecast",
      icon: "query_stats",
      href: historicForecastHref,
      match: "historic-forecast",
    },
    ...(role === "admin"
      ? [{ label: "Clients", icon: "groups", href: "/admin", match: "admin" }]
      : []),
  ];

  return (
    <nav
      className={`glass-sidebar print-hidden fixed left-0 top-0 h-full flex-col hidden md:flex z-50 transition-[width] duration-300 ease-in-out overflow-hidden ${
        collapsed ? "w-[72px]" : "w-[280px]"
      }`}
    >
      {/* Brand */}
      <div
        className={`py-5 border-b border-white/8 flex items-center flex-shrink-0 ${
          collapsed ? "justify-center px-0" : "px-5 gap-3"
        }`}
      >
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-container/60 to-on-tertiary-fixed-variant/40 flex items-center justify-center flex-shrink-0">
          <span className="material-symbols-outlined text-[16px] text-white/90">
            inventory_2
          </span>
        </div>
        {!collapsed && (
          <div className="min-w-0 flex-1 overflow-hidden">
            <h1 className="font-label-md text-label-md text-white tracking-tight truncate">
              Inventory Command
            </h1>
            <p className="font-label-sm text-label-sm text-white/40 mt-0.5">
              BrandQure
            </p>
          </div>
        )}
      </div>

      {/* Nav Links */}
      <div
        className={`flex-1 mt-3 flex flex-col gap-0.5 ${
          collapsed ? "px-2" : "px-3"
        }`}
      >
        {navItems.map((item) => {
          const active = isActive(item.match);
          return (
            <Link
              key={item.label}
              href={item.href}
              title={collapsed ? item.label : undefined}
              className={`flex items-center rounded-xl transition-all duration-150 ${
                collapsed
                  ? "justify-center p-2.5"
                  : "gap-3 px-3 py-2.5"
              } font-body-md text-body-md ${
                active
                  ? "bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
                  : "text-white/55 hover:bg-white/[0.06] hover:text-white/85"
              }`}
            >
              <span
                className={`material-symbols-outlined flex-shrink-0 transition-all ${
                  collapsed ? "text-[22px]" : "text-[20px]"
                } ${active ? "text-secondary-container" : ""}`}
              >
                {item.icon}
              </span>
              {!collapsed && (
                <span className="truncate">{item.label}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div
        className={`border-t border-white/8 ${
          collapsed ? "py-4 flex justify-center" : "px-4 py-4 mx-3 mb-3"
        }`}
      >
        {collapsed ? (
          <div
            title={name}
            className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-container/50 to-on-tertiary-fixed-variant/50 flex items-center justify-center flex-shrink-0 shadow-[0_0_0_2px_rgba(255,255,255,0.12)]"
          >
            <span className="font-label-md text-label-md text-white/90">
              {initials}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-secondary-container/50 to-on-tertiary-fixed-variant/50 flex items-center justify-center flex-shrink-0 shadow-[0_0_0_2px_rgba(255,255,255,0.12)]">
              <span className="font-label-md text-label-md text-white/90">
                {initials}
              </span>
            </div>
            <div className="min-w-0">
              <p className="font-label-md text-label-md text-white/90 truncate">
                {name}
              </p>
              <p className="font-label-sm text-label-sm text-white/40 capitalize">
                {role === "admin" ? "Admin" : "Client"}
              </p>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
