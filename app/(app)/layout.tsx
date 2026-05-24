import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import SidebarShell from "@/components/layout/SidebarShell";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const role: string = user.app_metadata?.role ?? "client";
  const name: string = user.app_metadata?.name ?? user.email ?? "User";
  const initials = name
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="app-bg">
      <SidebarShell role={role} name={name} initials={initials}>
        {children}
      </SidebarShell>
    </div>
  );
}
