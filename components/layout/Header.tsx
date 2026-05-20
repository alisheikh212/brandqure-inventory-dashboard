interface HeaderProps {
  initials: string;
}

export default function Header({ initials }: HeaderProps) {
  return (
    <header className="print-hidden fixed top-0 right-0 w-full md:w-[calc(100%-280px)] h-16 border-b border-outline-variant bg-surface-bright/80 backdrop-blur-md shadow-sm z-40 flex justify-between items-center px-4 md:px-8">
      {/* Search */}
      <div className="flex items-center flex-1">
        <div className="relative w-full max-w-md hidden md:block">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-[20px]">
            search
          </span>
          <input
            type="text"
            placeholder="Search SKUs, Clients..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-outline-variant rounded-full font-body-md text-body-md text-on-surface placeholder:text-on-surface-variant focus:outline-none focus:border-secondary-container focus:ring-2 focus:ring-secondary-container/20 transition-all"
            readOnly
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label="Notifications"
          className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>
        <a
          href="/admin"
          aria-label="Admin"
          className="p-2 text-on-surface-variant hover:bg-surface-container-high rounded-full transition-colors"
        >
          <span className="material-symbols-outlined">settings</span>
        </a>

        {/* Logout */}
        <form action="/logout" method="POST" className="ml-1">
          <button
            type="submit"
            aria-label="Sign out"
            title="Sign out"
            className="w-9 h-9 rounded-full bg-primary-container flex items-center justify-center text-white font-label-sm text-label-sm hover:opacity-90 transition-opacity"
          >
            {initials}
          </button>
        </form>
      </div>
    </header>
  );
}
