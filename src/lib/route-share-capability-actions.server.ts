"use server";

import { getLocale } from "next-intl/server";
import { checkRouteShareCapabilityServer } from "@/lib/route-share-capability.server";
import type { RouteShareContext } from "@/types/share-capability";
import type { AppLocale } from "@/types/haru";

export async function checkRouteShareCapabilityAction(input: {
  routeId: string;
  inviteToken?: string | null;
}): Promise<RouteShareContext> {
  const locale = (await getLocale()) as AppLocale;
  return checkRouteShareCapabilityServer({
    routeId: input.routeId,
    inviteToken: input.inviteToken ?? null,
    locale,
  });
}
