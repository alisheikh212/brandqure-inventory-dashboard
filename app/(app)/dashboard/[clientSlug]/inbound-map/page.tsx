import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getClientConfig } from "@/lib/clients";
import { getPendingInboundOrders } from "@/app/actions/inbound-orders";
import InboundJourneyMap from "@/components/inbound/InboundJourneyMap";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ clientSlug: string }>;
}

export default async function InboundMapPage({ params }: PageProps) {
  const { clientSlug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Client users can only view their own inbound map
  if (user?.app_metadata?.role === "client") {
    const allowedSlug = user.app_metadata?.clientSlug;
    if (allowedSlug && allowedSlug !== clientSlug) {
      redirect(`/dashboard/${allowedSlug}/inbound-map`);
    }
  }

  const clientConfig = await getClientConfig(clientSlug);
  if (!clientConfig) notFound();

  const inboundOrders = await getPendingInboundOrders(clientSlug);

  return (
    <InboundJourneyMap
      inboundOrders={inboundOrders}
      clientSlug={clientSlug}
    />
  );
}
