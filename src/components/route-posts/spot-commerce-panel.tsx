"use client";

import { ShoppingBag, ExternalLink, Sparkles, AlertCircle, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  COMMERCE_PAYMENT_MODE_LABELS,
  COMMERCE_TYPE_LABELS,
  type CommerceItem,
  type HaruRouteSpotCommerce,
} from "@/types/domain";

const DEFAULT_DISCLAIMER =
  "상품 구성, 재고, 운영 여부는 방문 시점에 따라 달라질 수 있습니다. 방문 전 확인을 권장합니다.";

/**
 * 결제 가능 스팟 패널 — 유료 상세(펼친 스팟)에서만 노출.
 * 본 단계는 mock — 실제 PG·재고·예약 연동은 향후 phase에서 진행한다.
 *
 * 구성:
 * 1. 헤더 (🛍 결제 가능 + payment_mode 배지 + 가격대)
 * 2. commerce_types 칩 row
 * 3. 구매 가능 품목 리스트 (관련 아티스트·공식·한정 배지)
 * 4. 예약/제휴 정보 (있을 때)
 * 5. disclaimer (mock·재고 변동 안내)
 */
export function SpotCommercePanel({
  commerce,
  className,
}: {
  commerce: HaruRouteSpotCommerce | undefined;
  className?: string;
}) {
  if (!commerce?.is_commerce_spot) return null;

  const paymentLabel = commerce.payment_mode
    ? COMMERCE_PAYMENT_MODE_LABELS[commerce.payment_mode]
    : null;

  return (
    <section
      aria-label="결제 가능 스팟"
      className={cn(
        "rounded-2xl border-2 border-orange-300/70 bg-gradient-to-br from-orange-50/70 to-amber-50/40 p-4",
        "dark:border-orange-700/40 dark:from-orange-950/25 dark:to-amber-950/15",
        className,
      )}
    >
      {/* 헤더 */}
      <header className="mb-3 flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm">
          <ShoppingBag className="size-3" />
          결제 가능 스팟
        </span>
        {paymentLabel ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-orange-300/70 bg-white px-2 py-0.5 text-[11px] font-semibold text-orange-700 dark:bg-orange-950/40 dark:text-orange-200">
            {paymentLabel}
          </span>
        ) : null}
        {commerce.price_range_label ? (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 dark:text-orange-200">
            <Tag className="size-3" />
            {commerce.price_range_label}
          </span>
        ) : null}
      </header>

      {/* commerce_types 칩 */}
      {commerce.commerce_types?.length ? (
        <div className="mb-3 flex flex-wrap gap-1">
          {commerce.commerce_types.map((t) => (
            <span
              key={t}
              className="inline-flex items-center rounded-md bg-white/80 px-1.5 py-0.5 text-[10.5px] font-medium text-orange-800 dark:bg-orange-950/40 dark:text-orange-200"
            >
              {COMMERCE_TYPE_LABELS[t]}
            </span>
          ))}
        </div>
      ) : null}

      {/* 구매 가능 품목 */}
      {commerce.purchasable_items?.length ? (
        <div className="mb-3">
          <p className="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-orange-700/80 dark:text-orange-300/80">
            구매 가능 품목
          </p>
          <ul className="space-y-1.5">
            {commerce.purchasable_items.map((item, i) => (
              <CommerceItemRow key={`${item.name}-${i}`} item={item} />
            ))}
          </ul>
        </div>
      ) : null}

      {/* 예약·제휴 */}
      {(commerce.reservation_required || commerce.reservation_url || commerce.partner_enabled) ? (
        <div className="mb-3 flex flex-wrap gap-2">
          {commerce.reservation_required ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-rose-300/60 bg-rose-50 px-2 py-1 text-[11px] font-semibold text-rose-700 dark:bg-rose-950/30 dark:text-rose-200 dark:border-rose-700/40">
              <Sparkles className="size-3" />
              예약 필요
            </span>
          ) : null}
          {commerce.reservation_url ? (
            <a
              href={commerce.reservation_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-md border border-orange-400/70 bg-orange-500 px-2.5 py-1 text-[11px] font-bold text-white shadow-sm transition-colors hover:bg-orange-600"
            >
              예약하기
              <ExternalLink className="size-2.5" />
            </a>
          ) : null}
          {commerce.partner_enabled && commerce.partner_name ? (
            <span className="inline-flex items-center gap-1 rounded-md border border-emerald-300/60 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200 dark:border-emerald-700/40">
              제휴: {commerce.partner_name}
            </span>
          ) : null}
        </div>
      ) : null}

      {/* disclaimer */}
      <p className="flex items-start gap-1.5 rounded-md bg-white/60 px-2 py-1.5 text-[10.5px] leading-snug text-orange-900/80 dark:bg-black/10 dark:text-orange-100/80">
        <AlertCircle className="mt-px size-3 shrink-0" aria-hidden />
        <span>{commerce.disclaimer || DEFAULT_DISCLAIMER}</span>
      </p>
    </section>
  );
}

function CommerceItemRow({ item }: { item: CommerceItem }) {
  return (
    <li className="flex items-start gap-2 rounded-md bg-white/70 px-2.5 py-1.5 dark:bg-black/10">
      <span className="mt-0.5 size-1.5 shrink-0 rounded-full bg-orange-500" aria-hidden />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-1.5">
          <p className="text-[12.5px] font-semibold text-foreground/90">{item.name}</p>
          {item.is_official ? (
            <span className="rounded-sm bg-orange-600 px-1 py-px text-[9px] font-bold text-white">
              공식
            </span>
          ) : null}
          {item.is_limited ? (
            <span className="rounded-sm bg-pink-600 px-1 py-px text-[9px] font-bold text-white">
              한정
            </span>
          ) : null}
        </div>
        {(item.related_artist || item.related_work || item.note) ? (
          <p className="mt-0.5 text-[10.5px] leading-snug text-muted-foreground">
            {[item.related_artist, item.related_work].filter(Boolean).join(" · ")}
            {item.note ? (
              <span className={cn((item.related_artist || item.related_work) && "ml-1")}>
                — {item.note}
              </span>
            ) : null}
          </p>
        ) : null}
      </div>
    </li>
  );
}
