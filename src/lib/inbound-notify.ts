/**
 * 신규 메시지 도착 알림 — 토스트 + 사운드 + 데스크톱 알림 (PR-L).
 *
 * 사용처:
 *  - HeaderInboxButton: Realtime 콜백
 *  - ThreadListClient: Realtime 콜백 (선택적으로 자체 토스트 억제)
 *
 * 토스트는 클라이언트 컴포넌트 컨텍스트가 필요하므로 이벤트 디스패치 방식.
 * <InboundNotifyBridge /> 가 마운트되면 window 이벤트를 수신해 useToast로 띄움.
 */

import type { ChatMessage } from "@/types/domain";

export const INBOUND_NOTIFY_EVENT = "safemate:inbound-message";

export interface InboundNotifyPayload {
  message: ChatMessage;
  /** 표시명(상대) — 없으면 "새 메시지" */
  fromDisplayName?: string;
  /** 출처 포스트 제목 — 있으면 "📍 ..." */
  sourcePostTitle?: string | null;
  /** 클릭 시 이동할 href */
  href?: string;
}

/** 어디서든 호출 가능 — 브릿지가 받아서 토스트/사운드/데스크톱 처리 */
export function emitInboundMessage(payload: InboundNotifyPayload) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent<InboundNotifyPayload>(INBOUND_NOTIFY_EVENT, { detail: payload }));
}

// ── 사용자 설정 (localStorage) ──────────────────────────────────────────────
const SOUND_KEY = "safemate.notif.sound";
const DESKTOP_KEY = "safemate.notif.desktop";

export function isSoundEnabled(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem(SOUND_KEY) !== "0";
}

export function setSoundEnabled(on: boolean) {
  if (typeof window === "undefined") return;
  localStorage.setItem(SOUND_KEY, on ? "1" : "0");
}

export function getDesktopMode(): "auto" | "on" | "off" {
  if (typeof window === "undefined") return "auto";
  const v = localStorage.getItem(DESKTOP_KEY);
  if (v === "on" || v === "off") return v;
  return "auto";
}

export function setDesktopMode(m: "auto" | "on" | "off") {
  if (typeof window === "undefined") return;
  localStorage.setItem(DESKTOP_KEY, m);
}

// ── 사운드 재생 (Web Audio 비프 — 파일 의존 X) ───────────────────────────
let _ctx: AudioContext | null = null;
export function playInboundSound() {
  if (!isSoundEnabled()) return;
  if (typeof window === "undefined") return;
  try {
    const AC = (window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext) as
      | typeof AudioContext
      | undefined;
    if (!AC) return;
    if (!_ctx) _ctx = new AC();
    // 사용자 인터랙션 전이면 suspended 상태 → resume 시도
    if (_ctx.state === "suspended") void _ctx.resume().catch(() => {});
    const now = _ctx.currentTime;
    const osc = _ctx.createOscillator();
    const gain = _ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    osc.frequency.exponentialRampToValueAtTime(660, now + 0.18);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
    osc.connect(gain);
    gain.connect(_ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  } catch {
    // ignore
  }
}

// ── 데스크톱 알림 권한 ───────────────────────────────────────────────────────
export function isDesktopGranted(): boolean {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  return Notification.permission === "granted";
}

export async function requestDesktopPermissionIfAllowed(): Promise<boolean> {
  if (typeof window === "undefined" || !("Notification" in window)) return false;
  if (getDesktopMode() === "off") return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  try {
    const res = await Notification.requestPermission();
    return res === "granted";
  } catch {
    return false;
  }
}

export function showDesktopNotification(title: string, body: string, href?: string) {
  if (!isDesktopGranted() || getDesktopMode() === "off") return;
  try {
    const n = new Notification(title, { body, icon: "/images/brand/haru-mark.png", silent: false });
    if (href) {
      n.onclick = () => {
        window.focus();
        window.location.href = href;
        n.close();
      };
    }
  } catch {
    // ignore
  }
}
