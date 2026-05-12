import type { SupabaseClient } from "@supabase/supabase-js";
import type { MessageThreadListRow } from "@/types/domain";

type ThreadRow = {
  id: string;
  booking_id: string | null;
  inquiry_kind: string;
  traveler_user_id: string;
  guardian_user_id: string;
  max_messages_traveler: number;
  traveler_message_count: number;
  last_message_at: string | null;
  created_at: string;
  content_post_id: string | null;
};

type MsgRow = {
  thread_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  sender_user_id: string;
};

type GpRow = {
  user_id: string;
  display_name: string | null;
  avatar_image_url: string | null;
  photo_url: string | null;
};

function coalesceAvatar(gp: GpRow | undefined): string | null {
  if (!gp) return null;
  const a = gp.avatar_image_url?.trim() || "";
  const p = gp.photo_url?.trim() || "";
  const v = a || p;
  return v === "" ? null : v;
}

/**
 * `message_threads_list_for_viewer` / `service_message_threads_list_for_user` RPC가
 * 없거나 실패할 때, service 클라이언트로 동일 스키마의 목록을 조립한다.
 */
export async function fetchMessageThreadListRowsForParticipant(
  svc: SupabaseClient,
  participantUserId: string,
): Promise<MessageThreadListRow[]> {
  const { data: threads, error: tErr } = await svc
    .from("message_threads")
    .select(
      "id, booking_id, inquiry_kind, traveler_user_id, guardian_user_id, max_messages_traveler, traveler_message_count, last_message_at, created_at, content_post_id",
    )
    .or(`traveler_user_id.eq.${participantUserId},guardian_user_id.eq.${participantUserId}`)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(200);

  if (tErr || !threads?.length) return [];

  const typed = threads as ThreadRow[];
  const ids = typed.map((t) => t.id);

  const { data: msgs, error: mErr } = await svc
    .from("messages")
    .select("thread_id, content, created_at, is_read, sender_user_id")
    .in("thread_id", ids);

  if (mErr || !msgs?.length) return [];

  const byThread = new Map<string, MsgRow[]>();
  for (const m of msgs as MsgRow[]) {
    const arr = byThread.get(m.thread_id) ?? [];
    arr.push(m);
    byThread.set(m.thread_id, arr);
  }
  for (const arr of byThread.values()) {
    arr.sort((a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0));
  }

  const withMessages = typed.filter((t) => (byThread.get(t.id)?.length ?? 0) > 0);
  if (!withMessages.length) return [];

  const otherIds = [
    ...new Set(
      withMessages.map((t) =>
        t.traveler_user_id === participantUserId ? t.guardian_user_id : t.traveler_user_id,
      ),
    ),
  ];

  const { data: profiles } = await svc
    .from("guardian_profiles")
    .select("user_id, display_name, avatar_image_url, photo_url")
    .in("user_id", otherIds);

  const gpByUser = new Map<string, GpRow>();
  for (const row of (profiles ?? []) as GpRow[]) {
    gpByUser.set(row.user_id, row);
  }

  const rows: MessageThreadListRow[] = [];
  for (const mt of withMessages) {
    const list = byThread.get(mt.id)!;
    const isViewerTraveler = mt.traveler_user_id === participantUserId;
    const otherUserId = isViewerTraveler ? mt.guardian_user_id : mt.traveler_user_id;
    const gp = gpByUser.get(otherUserId);

    const other_display_name = isViewerTraveler
      ? gp?.display_name?.trim() || "하루이"
      : gp?.display_name?.trim() || "여행자";

    const other_avatar_url = isViewerTraveler ? coalesceAvatar(gp) : coalesceAvatar(gp);

    const unread_count = list.filter(
      (m) => m.is_read !== true && m.sender_user_id !== participantUserId,
    ).length;
    const last = list[0];
    const last_message_preview = last?.content ? last.content.slice(0, 160) : null;

    rows.push({
      id: mt.id,
      booking_id: mt.booking_id,
      inquiry_kind: mt.inquiry_kind as MessageThreadListRow["inquiry_kind"],
      traveler_user_id: mt.traveler_user_id,
      guardian_user_id: mt.guardian_user_id,
      max_messages_traveler: mt.max_messages_traveler,
      traveler_message_count: mt.traveler_message_count,
      last_message_at: mt.last_message_at,
      created_at: mt.created_at,
      content_post_id: mt.content_post_id,
      other_user_id: otherUserId,
      other_display_name,
      other_avatar_url,
      unread_count,
      last_message_preview,
      message_count: list.length,
    });
  }

  return rows;
}
