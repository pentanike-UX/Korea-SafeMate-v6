import type { AttentionBlockKey, AttentionMenuKey } from "@/types/mypage-hub";
import {
  ATTENTION_BLOCK_KEYS,
  GUARDIAN_WORKSPACE_NAV_BADGE_KEYS,
  TRAVELER_NAV_BADGE_KEYS,
} from "@/types/mypage-hub";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

const ALL_MENU_KEYS = [...TRAVELER_NAV_BADGE_KEYS, ...GUARDIAN_WORKSPACE_NAV_BADGE_KEYS] as const;

export function isAttentionMenuKey(k: string): k is AttentionMenuKey {
  return (ALL_MENU_KEYS as readonly string[]).includes(k);
}

export async function getSeenMapForUser(userId: string): Promise<Partial<Record<AttentionMenuKey, string>>> {
  const sb = createServiceRoleSupabase();
  if (!sb) return {};

  const { data, error } = await sb
    .from("mypage_menu_attention_seen")
    .select("menu_key, seen_signature")
    .eq("user_id", userId);

  if (error) {
    console.error("[mypage-attention-seen]", error);
    return {};
  }

  const out: Partial<Record<AttentionMenuKey, string>> = {};
  for (const row of data ?? []) {
    const mk = row.menu_key;
    if (typeof mk === "string" && isAttentionMenuKey(mk) && typeof row.seen_signature === "string") {
      out[mk] = row.seen_signature;
    }
  }
  return out;
}

export async function upsertSeenSignature(userId: string, menuKey: AttentionMenuKey, signature: string): Promise<void> {
  const sb = createServiceRoleSupabase();
  if (!sb) return;

  const { error } = await sb.from("mypage_menu_attention_seen").upsert(
    {
      user_id: userId,
      menu_key: menuKey,
      seen_signature: signature,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,menu_key" },
  );

  if (error) {
    console.error("[mypage-attention-seen upsert]", error);
  }
}

export function isAttentionBlockKey(k: string): k is AttentionBlockKey {
  return (ATTENTION_BLOCK_KEYS as readonly string[]).includes(k);
}

export async function getBlockSeenMapForUser(userId: string): Promise<Partial<Record<AttentionBlockKey, string>>> {
  const sb = createServiceRoleSupabase();
  if (!sb) return {};

  const { data, error } = await sb
    .from("mypage_block_attention_seen")
    .select("block_key, seen_signature")
    .eq("user_id", userId);

  if (error) {
    console.error("[mypage-block-attention-seen]", error);
    return {};
  }

  const out: Partial<Record<AttentionBlockKey, string>> = {};
  for (const row of data ?? []) {
    const bk = row.block_key;
    if (typeof bk === "string" && isAttentionBlockKey(bk) && typeof row.seen_signature === "string") {
      out[bk] = row.seen_signature;
    }
  }
  return out;
}

export async function upsertBlockSeenSignature(
  userId: string,
  blockKey: AttentionBlockKey,
  signature: string,
): Promise<void> {
  const sb = createServiceRoleSupabase();
  if (!sb) return;

  const { error } = await sb.from("mypage_block_attention_seen").upsert(
    {
      user_id: userId,
      block_key: blockKey,
      seen_signature: signature,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,block_key" },
  );

  if (error) {
    console.error("[mypage-block-attention-seen upsert]", error);
  }
}
