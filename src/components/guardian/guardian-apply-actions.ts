"use server";

import { z } from "zod";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";

const applySchema = z.object({
  realName: z.string().trim().min(1).max(120),
  displayName: z.string().trim().min(1).max(120),
  contactEmail: z.string().trim().email().max(254),
  languages: z.array(z.string().trim().min(1)).min(1).max(20),
  motivation: z.string().trim().min(10).max(4000),
});

export interface SubmitGuardianApplicationResult {
  ok: boolean;
  /** 미로그인 — 클라이언트가 로그인으로 유도. */
  needsLogin?: boolean;
  /** 이미 지원함(user_id unique). */
  alreadyApplied?: boolean;
  error?: string;
}

export async function submitGuardianApplicationAction(input: {
  realName: string;
  displayName: string;
  contactEmail: string;
  languages: string[];
  motivation: string;
}): Promise<SubmitGuardianApplicationResult> {
  const userId = await getSupabaseAuthUserIdOnly();
  if (!userId) return { ok: false, needsLogin: true };

  const parsed = applySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "입력값을 확인해 주세요." };
  }

  const sb = await getServerSupabaseForUser();
  if (!sb) return { ok: false, needsLogin: true };

  // user_id unique — 기존 지원 확인
  const { data: existing } = await sb
    .from("guardian_applications")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return { ok: false, alreadyApplied: true };

  const { error } = await sb.from("guardian_applications").insert({
    user_id: userId,
    real_name: parsed.data.realName,
    display_name: parsed.data.displayName,
    contact_email: parsed.data.contactEmail,
    languages: parsed.data.languages,
    motivation: parsed.data.motivation,
  });
  if (error) {
    // 동시 제출 등으로 unique 위반 시
    if (error.code === "23505") return { ok: false, alreadyApplied: true };
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
