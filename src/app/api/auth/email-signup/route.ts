import { NextResponse } from "next/server";
import { safeNextPath } from "@/lib/auth/safe-next-path";
import { resolveOAuthRedirectBase } from "@/lib/site-url";
import { getServerSupabaseForUser } from "@/lib/supabase/server-user";

type RequestBody = {
  name?: string;
  email?: string;
  agree?: boolean;
  next?: string;
};

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function classifyError(message: string) {
  const m = message.toLowerCase();
  if (m.includes("already") || m.includes("exists") || m.includes("registered")) return "email_exists";
  if (m.includes("rate") || m.includes("too many")) return "rate_limit";
  if (m.includes("network")) return "network";
  return "unknown";
}

export async function POST(request: Request) {
  const sb = await getServerSupabaseForUser();
  if (!sb) {
    return NextResponse.json({ code: "network" }, { status: 503 });
  }

  const payload = (await request.json().catch(() => ({}))) as RequestBody;
  const email = payload.email?.trim().toLowerCase() ?? "";
  const name = payload.name?.trim() ?? "";
  const agree = payload.agree === true;

  if (!name) {
    return NextResponse.json({ code: "name_required" }, { status: 400 });
  }
  if (!isValidEmail(email)) {
    return NextResponse.json({ code: "invalid_email" }, { status: 400 });
  }
  if (!agree) {
    return NextResponse.json({ code: "terms_required" }, { status: 400 });
  }

  const nextPath = safeNextPath(payload.next) ?? "/onboarding";
  const callbackUrl = new URL("/auth/callback", resolveOAuthRedirectBase(request));
  callbackUrl.searchParams.set("next", nextPath);

  const { error } = await sb.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: callbackUrl.toString(),
      shouldCreateUser: true,
      data: {
        full_name: name,
      },
    },
  });

  if (error) {
    return NextResponse.json({ code: classifyError(error.message), message: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
