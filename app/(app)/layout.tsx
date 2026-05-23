import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";

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
      <Sidebar role={role} name={name} initials={initials} />
      <Header initials={initials} />
      <div className="md:ml-[280px] pt-16 min-h-screen flex flex-col print:ml-0 print:pt-0">
        {children}
      </div>
    </div>
  );
}
