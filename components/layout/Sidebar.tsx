"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface SidebarProps {
  role: string;
  name: string;
  initials: string;
}

export default function Sidebar({ role, name, initials }: SidebarProps) {
  const pathname = usePathname();

  const parts = pathname.split("/");
  const clientSlug =
    parts[1] === "dashboard" && parts[2] ? parts[2] : null;

  const dashboardHref = clientSlug ? `/dashboard/${clientSlug}` : "/admin";
  const reorderHref = clientSlug ? `/dashboard/${clientSlug}/reorder` : "/admin";
  const reportHref = clientSlug ? `/dashboard/${clientSlug}/print` : "/admin";

  const isActive = (match: string) => {
    if (match === "admin") return pathname === "/admin";
    if (match === "reorder") return pathname.endsWith("/reorder");
    if (match === "print") return pathname.endsWith("/print");
    if (match === "dashboard")
      return (
        pathname.startsWith("/dashboard") &&
        !pathname.endsWith("/reorder") &&
        !pathname.endsWith("/print")
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
    // Clients nav item only visible to admin
    ...(role === "admin"
      ? [{ label: "Clients", icon: "groups", href: "/admin", match: "admin" }]
      : []),
  ];

  return (
    <nav className="glass-sidebar print-hidden fixed left-0 top-0 h-full w-[280px] shadow-sm flex-col hidden md:flex z-50">
      {/* Brand */}
      <div className="p-6 border-b border-white/10">
        <h1 className="font-headline-md text-headline-md text-white">
          Inventory Command
        </h1>
        <p className="font-label-sm text-label-sm text-on-primary-container mt-1">
          BrandQure
        </p>
      </div>

      {/* Nav Links */}
      <div className="flex-1 mt-4 flex flex-col gap-1">
        {navItems.map((item) => {
          const active = isActive(item.match);
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 font-body-md text-body-md transition-colors ${
                active
                  ? "bg-white/10 text-white border-l-4 border-secondary-container"
                  : "text-on-primary-container hover:bg-white/5 border-l-4 border-transparent"
              }`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* User Profile */}
      <div className="p-6 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center flex-shrink-0">
            <span className="font-label-md text-label-md text-on-surface-variant">
              {initials}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-label-md text-label-md text-white truncate">
              {name}
            </p>
            <p className="font-label-sm text-label-sm text-on-primary-container capitalize">
              {role === "admin" ? "Admin" : "Client"}
            </p>
          </div>
        </div>
      </div>
    </nav>
  );
}
