"use client";

/**
 * INBOUND_NOTIFY_EVENT 수신 → 토스트 + 사운드 + 데스크톱 알림.
 * <ToastProvider> 안쪽에 마운트되어야 useToast 호출 가능.
 */

import { useEffect } from "react";
import { useToast } from "@/components/ui/toast";
import {
  INBOUND_NOTIFY_EVENT,
  playInboundSound,
  showDesktopNotification,
  type InboundNotifyPayload,
} from "@/lib/inbound-notify";

export function InboundNotifyBridge() {
  const { toast } = useToast();

  useEffect(() => {
    const onInbound = (e: Event) => {
      const detail = (e as CustomEvent<InboundNotifyPayload>).detail;
      if (!detail?.message) return;
      const title = detail.fromDisplayName ? `${detail.fromDisplayName}님` : "새 메시지";
      const body = detail.sourcePostTitle
        ? `📍 ${detail.sourcePostTitle}\n${detail.message.content}`
        : detail.message.content;
      // 토스트
      toast({
        variant: "info",
        title,
        description: detail.message.content,
        durationMs: 5000,
      });
      // 사운드 (옵트인 — 사용자 인터랙션 후만 동작)
      playInboundSound();
      // 데스크톱 알림 (권한 동의 시)
      showDesktopNotification(title, body, detail.href);
    };
    window.addEventListener(INBOUND_NOTIFY_EVENT, onInbound);
    return () => window.removeEventListener(INBOUND_NOTIFY_EVENT, onInbound);
  }, [toast]);

  return null;
}
