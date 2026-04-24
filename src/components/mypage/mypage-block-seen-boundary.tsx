"use client";

import { useEffect, useRef } from "react";
import type { AttentionBlockKey } from "@/types/mypage-hub";
import type { MypageHubContextValue } from "@/types/mypage-hub";
import { useMypageHubContext } from "@/components/mypage/mypage-hub-context";
import { cn } from "@/lib/utils";

function joinBlockSignature(ctx: MypageHubContextValue, keys: AttentionBlockKey[]) {
  return keys.map((k) => `${k}=${ctx.snapshot.blockAttentionSignatures[k] ?? "0"}`).join("&");
}

/**
 * 블록이 뷰포트에 일정 비율 들어오면 해당 블록 attention 시그니처를 seen 처리한다.
 * 파티션된 메뉴(navMatches 등)는 메뉴 이탈만으로 전체 seen 되지 않으므로 이 관측이 필요하다.
 */
export function MypageBlockSeenBoundary(
  props:
    | { blockKey: AttentionBlockKey; blockKeys?: undefined; className?: string; children: React.ReactNode }
    | { blockKey?: undefined; blockKeys: AttentionBlockKey[]; className?: string; children: React.ReactNode },
) {
  const { className, children } = props;
  const keys: AttentionBlockKey[] =
    "blockKeys" in props && props.blockKeys?.length
      ? props.blockKeys
      : props.blockKey
        ? [props.blockKey]
        : [];
  const keysId = keys.join(",");

  const ctx = useMypageHubContext();
  const ref = useRef<HTMLDivElement>(null);
  const doneRef = useRef(false);

  const signature = ctx ? joinBlockSignature(ctx, keys) : "";

  useEffect(() => {
    doneRef.current = false;
  }, [keysId, signature]);

  useEffect(() => {
    if (!ctx?.accountUserId || keys.length === 0) return;
    const el = ref.current;
    if (!el) return;
    const anySignal = keys.some((k) => (ctx.snapshot.blockAttentionSignatures[k] ?? "0") !== "0");
    if (!anySignal) {
      doneRef.current = true;
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.35);
        if (hit && !doneRef.current) {
          doneRef.current = true;
          for (const k of keys) {
            const sig = ctx.snapshot.blockAttentionSignatures[k] ?? "0";
            if (sig !== "0") ctx.markBlockAttentionSeen(k, sig);
          }
          io.disconnect();
        }
      },
      { threshold: [0.2, 0.35, 0.5], rootMargin: "0px 0px -8% 0px" },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [ctx, keysId, signature]);

  if (!ctx) {
    return <div className={cn(className)}>{children}</div>;
  }

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}
