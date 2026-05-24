"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";

interface SidebarShellProps {
  role: string;
  name: string;
  initials: string;
  children: React.ReactNode;
}

export default function SidebarShell({
  role,
  name,
  initials,
  children,
}: SidebarShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const toggle = () => setCollapsed((c) => !c);

  return (
    <>
      <Sidebar
        role={role}
        name={name}
        initials={initials}
        collapsed={collapsed}
      />
      <Header initials={initials} collapsed={collapsed} onToggle={toggle} />
      <div
        className={`${
          collapsed ? "md:ml-[72px]" : "md:ml-[280px]"
        } pt-16 min-h-screen flex flex-col print:ml-0 print:pt-0 transition-[margin] duration-300 ease-in-out`}
      >
        {children}
      </div>
    </>
  );
}
