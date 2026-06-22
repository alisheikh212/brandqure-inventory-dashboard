interface HeaderProps {
  initials: string;
  collapsed: boolean;
  onToggle: () => void;
}

export default function Header({ initials, collapsed, onToggle }: HeaderProps) {
  return (
    <header
      className={`glass-header print-hidden fixed top-0 right-0 h-16 z-40 flex justify-between items-center px-4 md:px-6 transition-[width] duration-300 ease-in-out w-full ${
        collapsed ? "md:w-[calc(100%-72px)]" : "md:w-[calc(100%-280px)]"
      }`}
    >
      {/* Left: toggle + search */}
      <div className="flex items-center gap-3 flex-1">
        {/* Sidebar toggle — desktop only */}
        <button
          type="button"
          onClick={onToggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className="hidden md:flex p-2 text-on-surface-variant hover:bg-white/[0.08] rounded-full transition-all flex-shrink-0"
        >
          <span className="material-symbols-outlined text-[22px]">
            {collapsed ? "menu_open" : "menu"}
          </span>
        </button>

        {/* Search bar */}
        <div className="relative w-full max-w-md hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search SKUs, Clients..."
            className="w-full pl-10 pr-4 py-2 bg-[#1d1d1d]/80 backdrop-blur-sm border border-white/[0.09] rounded-full font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary-container/40 focus:ring-2 focus:ring-secondary-container/10 transition-all"
            readOnly
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <a
          href="/settings"
          aria-label="Settings"
          className="p-2 text-on-surface-variant hover:bg-white/[0.08] rounded-full transition-all"
        >
          <span className="material-symbols-outlined">settings</span>
        </a>

        {/* Avatar — display only, not clickable */}
        <div
          aria-label="Signed in"
          className="ml-1 w-9 h-9 rounded-full bg-gradient-to-br from-on-tertiary-fixed-variant to-primary-container flex items-center justify-center text-white font-label-sm text-label-sm shadow-sm"
        >
          {initials}
        </div>
      </div>
    </header>
  );
}
