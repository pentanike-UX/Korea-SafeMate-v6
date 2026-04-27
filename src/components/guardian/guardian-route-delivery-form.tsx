"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";

type BookingOption = {
  id: string;
  status: string;
  tier: string | null;
  requested_start: string | null;
};

type SpotOption = {
  id: string;
  name_ko: string;
  name_en: string | null;
  category: string;
  avg_stay_min: number | null;
};

type SelectedSpot = {
  spot_id: string;
  stay_min: number;
  guardian_note_ko: string;
  move_from_prev_method: "walk" | "subway" | "taxi" | "";
  move_from_prev_min: number | "";
};

function fmtDate(iso: string | null): string {
  if (!iso) return "-";
  try {
    return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium" }).format(new Date(iso));
  } catch {
    return iso;
  }
}

export function GuardianRouteDeliveryForm({
  bookings,
  spots,
  initialBookingId,
}: {
  bookings: BookingOption[];
  spots: SpotOption[];
  initialBookingId: string | null;
}) {
  const router = useRouter();
  const [bookingId, setBookingId] = useState<string>(initialBookingId ?? bookings[0]?.id ?? "");
  const [titleKo, setTitleKo] = useState("");
  const [titleEn, setTitleEn] = useState("");
  const [status, setStatus] = useState<"private" | "under_review" | "public">("private");
  const [selected, setSelected] = useState<SelectedSpot[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedRouteId, setSavedRouteId] = useState<string | null>(null);

  const spotById = useMemo(() => new Map(spots.map((s) => [s.id, s])), [spots]);
  const selectedIdSet = useMemo(() => new Set(selected.map((s) => s.spot_id)), [selected]);
  const availableSpots = useMemo(() => spots.filter((s) => !selectedIdSet.has(s.id)), [spots, selectedIdSet]);

  function addSpot(id: string) {
    const spot = spotById.get(id);
    if (!spot) return;
    setSelected((prev) => [
      ...prev,
      {
        spot_id: id,
        stay_min: spot.avg_stay_min ?? 60,
        guardian_note_ko: "",
        move_from_prev_method: "",
        move_from_prev_min: "",
      },
    ]);
  }

  function removeSpot(index: number) {
    setSelected((prev) => prev.filter((_, i) => i !== index));
  }

  function moveSpot(index: number, direction: -1 | 1) {
    setSelected((prev) => {
      const next = [...prev];
      const target = index + direction;
      if (target < 0 || target >= next.length) return prev;
      const tmp = next[index];
      next[index] = next[target];
      next[target] = tmp;
      return next;
    });
  }

  function patchSpot(index: number, patch: Partial<SelectedSpot>) {
    setSelected((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));
  }

  async function submit() {
    setError(null);
    setSavedRouteId(null);
    if (!bookingId) {
      setError("예약(booking)을 선택해 주세요.");
      return;
    }
    if (selected.length === 0) {
      setError("최소 1개 이상의 스팟이 필요합니다.");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        order_id: bookingId,
        title_ko: titleKo,
        title_en: titleEn,
        status,
        spots: selected.map((s, idx) => ({
          spot_id: s.spot_id,
          stay_min: s.stay_min,
          guardian_note_ko: s.guardian_note_ko || null,
          move_from_prev_method: idx === 0 ? null : s.move_from_prev_method || null,
          move_from_prev_min: idx === 0 ? null : s.move_from_prev_min === "" ? null : Number(s.move_from_prev_min),
        })),
      };
      const res = await fetch("/api/guardian/routes", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = (await res.json().catch(() => ({}))) as {
        error?: string;
        route_id?: string;
      };
      if (!res.ok) {
        setError(json.error ?? "루트 저장에 실패했습니다.");
        return;
      }
      setSavedRouteId(json.route_id ?? null);
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  if (bookings.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border p-6 text-sm text-muted-foreground">
        배정된 예약이 없어 루트를 전달할 수 없습니다. 먼저 매칭이 확정된 예약을 준비해 주세요.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="space-y-3 rounded-xl border border-border/70 p-4">
        <h2 className="text-base font-semibold">1) 대상 예약 선택</h2>
        <select
          value={bookingId}
          onChange={(e) => setBookingId(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          {bookings.map((b) => (
            <option key={b.id} value={b.id}>
              {b.id.slice(0, 8)}... · {b.status} · {b.tier ?? "tier-unknown"} · {fmtDate(b.requested_start)}
            </option>
          ))}
        </select>
      </section>

      <section className="space-y-3 rounded-xl border border-border/70 p-4">
        <h2 className="text-base font-semibold">2) 루트 기본 정보</h2>
        <input
          value={titleKo}
          onChange={(e) => setTitleKo(e.target.value)}
          placeholder="제목(ko) 예: 성수-압구정 반나절"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <input
          value={titleEn}
          onChange={(e) => setTitleEn(e.target.value)}
          placeholder="Title (en) optional"
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        />
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as "private" | "under_review" | "public")}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
        >
          <option value="private">private (기본)</option>
          <option value="under_review">under_review</option>
          <option value="public">public</option>
        </select>
      </section>

      <section className="space-y-3 rounded-xl border border-border/70 p-4">
        <h2 className="text-base font-semibold">3) 스팟 구성 (route_spots)</h2>
        <div className="grid gap-2 md:grid-cols-2">
          {availableSpots.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.name_ko || s.name_en || s.id}</p>
                <p className="text-xs text-muted-foreground">
                  {s.category} · 평균 {s.avg_stay_min ?? 60}분
                </p>
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => addSpot(s.id)}>
                추가
              </Button>
            </div>
          ))}
        </div>

        {selected.length > 0 ? (
          <ol className="space-y-3">
            {selected.map((row, i) => {
              const spot = spotById.get(row.spot_id);
              return (
                <li key={`${row.spot_id}-${i}`} className="space-y-2 rounded-lg border border-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold">
                      {i + 1}. {spot?.name_ko || spot?.name_en || row.spot_id}
                    </p>
                    <div className="flex gap-1">
                      <Button type="button" size="sm" variant="ghost" onClick={() => moveSpot(i, -1)} disabled={i === 0}>
                        ↑
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => moveSpot(i, 1)}
                        disabled={i === selected.length - 1}
                      >
                        ↓
                      </Button>
                      <Button type="button" size="sm" variant="outline" onClick={() => removeSpot(i)}>
                        삭제
                      </Button>
                    </div>
                  </div>
                  <div className="grid gap-2 md:grid-cols-3">
                    <input
                      type="number"
                      min={10}
                      max={720}
                      value={row.stay_min}
                      onChange={(e) => patchSpot(i, { stay_min: Number(e.target.value || 60) })}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="stay_min"
                    />
                    <select
                      value={row.move_from_prev_method}
                      onChange={(e) =>
                        patchSpot(i, {
                          move_from_prev_method: e.target.value as "walk" | "subway" | "taxi" | "",
                        })
                      }
                      disabled={i === 0}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    >
                      <option value="">이동수단 없음</option>
                      <option value="walk">walk</option>
                      <option value="subway">subway</option>
                      <option value="taxi">taxi</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      max={240}
                      value={row.move_from_prev_min}
                      onChange={(e) => patchSpot(i, { move_from_prev_min: e.target.value === "" ? "" : Number(e.target.value) })}
                      disabled={i === 0}
                      className="rounded-lg border border-border bg-background px-3 py-2 text-sm"
                      placeholder="이동 시간(분)"
                    />
                  </div>
                  <textarea
                    value={row.guardian_note_ko}
                    onChange={(e) => patchSpot(i, { guardian_note_ko: e.target.value })}
                    className="h-20 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm"
                    placeholder="가디언 메모(ko)"
                  />
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="text-sm text-muted-foreground">아직 추가된 스팟이 없습니다.</p>
        )}
      </section>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}
      {savedRouteId ? (
        <p className="text-sm text-emerald-700">
          저장 완료: <span className="font-mono">{savedRouteId}</span>{" "}
          <Link href={`/routes/${savedRouteId}`} className="underline underline-offset-2">
            루트 보기
          </Link>
        </p>
      ) : null}

      <div className="flex items-center gap-2">
        <Button type="button" className="rounded-xl" disabled={saving} onClick={() => void submit()}>
          {saving ? "저장 중..." : "루트 전달 저장"}
        </Button>
        <Button asChild type="button" variant="outline" className="rounded-xl">
          <Link href="/mypage/guardian/matches">매칭 목록으로</Link>
        </Button>
      </div>
    </div>
  );
}
