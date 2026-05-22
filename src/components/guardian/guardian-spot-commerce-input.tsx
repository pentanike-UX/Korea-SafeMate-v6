"use client";

import { useState } from "react";
import { ChevronDown, Plus, X, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  COMMERCE_PAYMENT_MODE_LABELS,
  COMMERCE_TYPE_LABELS,
  type CommerceItem,
  type CommercePaymentMode,
  type CommerceType,
  type HaruRouteSpotCommerce,
} from "@/types/domain";

const ALL_COMMERCE_TYPES: CommerceType[] = [
  "goods",
  "album",
  "photo_card",
  "light_stick",
  "popup_store",
  "fan_cafe",
  "photo_booth",
  "food",
  "drink",
  "ticket",
  "rental",
  "class",
  "beauty",
  "fashion",
  "souvenir",
  "exhibition",
  "other",
];

const PAYMENT_MODES: CommercePaymentMode[] = ["onsite", "online", "reservation", "partner", "none"];

const DEFAULT_DISCLAIMER =
  "상품 구성, 재고, 운영 여부는 방문 시점에 따라 달라질 수 있습니다. 방문 전 확인을 권장합니다.";

/**
 * 하루이 에디터의 결제 가능 스팟 입력 섹션.
 * - 기본 접힘. "결제 가능 스팟으로 설정" 토글이 켜지면 펼쳐짐.
 * - 토글 OFF 시 commerce를 undefined로 설정해 패널을 숨김.
 * - 토글 ON 시 commerce_types/payment_mode/구매 가능 품목 등 입력.
 */
export function GuardianSpotCommerceInput({
  value,
  onChange,
}: {
  value: HaruRouteSpotCommerce | undefined;
  onChange: (next: HaruRouteSpotCommerce | undefined) => void;
}) {
  const enabled = Boolean(value?.is_commerce_spot);
  const [openItem, setOpenItem] = useState(enabled);

  const setEnabled = (next: boolean) => {
    setOpenItem(next);
    if (next) {
      onChange({
        is_commerce_spot: true,
        commerce_types: value?.commerce_types ?? [],
        payment_mode: value?.payment_mode ?? "onsite",
        price_range_label: value?.price_range_label ?? "",
        purchasable_items: value?.purchasable_items ?? [],
        reservation_required: value?.reservation_required ?? false,
        reservation_url: value?.reservation_url ?? "",
        partner_enabled: value?.partner_enabled ?? false,
        partner_name: value?.partner_name ?? "",
        disclaimer: value?.disclaimer ?? "",
      });
    } else {
      onChange(undefined);
    }
  };

  const patch = (p: Partial<HaruRouteSpotCommerce>) => {
    if (!value) return;
    onChange({ ...value, ...p });
  };

  const toggleType = (t: CommerceType) => {
    if (!value) return;
    const set = new Set(value.commerce_types);
    if (set.has(t)) set.delete(t);
    else set.add(t);
    patch({ commerce_types: Array.from(set) });
  };

  const addItem = () => {
    if (!value) return;
    const items = [...(value.purchasable_items ?? []), { name: "" } as CommerceItem];
    patch({ purchasable_items: items });
  };

  const updateItem = (i: number, p: Partial<CommerceItem>) => {
    if (!value) return;
    const items = [...(value.purchasable_items ?? [])];
    items[i] = { ...items[i]!, ...p };
    patch({ purchasable_items: items });
  };

  const removeItem = (i: number) => {
    if (!value) return;
    const items = (value.purchasable_items ?? []).filter((_, j) => j !== i);
    patch({ purchasable_items: items });
  };

  return (
    <div className="rounded-2xl border border-orange-300/40 bg-orange-50/30 dark:border-orange-700/30 dark:bg-orange-950/15">
      {/* 토글 헤더 */}
      <button
        type="button"
        onClick={() => {
          if (!enabled) setEnabled(true);
          else setOpenItem((o) => !o);
        }}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
        aria-expanded={openItem && enabled}
      >
        <ShoppingBag className="size-4 text-orange-600" aria-hidden />
        <span className="flex-1 text-sm font-semibold text-foreground">
          결제 가능 스팟으로 설정
        </span>
        <input
          type="checkbox"
          checked={enabled}
          readOnly
          onClick={(e) => {
            e.stopPropagation();
            setEnabled(!enabled);
          }}
          className="size-4 accent-orange-500"
          aria-label="결제 가능 스팟 사용"
        />
        {enabled ? (
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", openItem && "rotate-180")} aria-hidden />
        ) : null}
      </button>

      {/* 펼침 본문 */}
      {enabled && openItem && value ? (
        <div className="space-y-4 border-t border-orange-300/30 px-4 py-4 dark:border-orange-700/30">
          {/* commerce_types 칩 */}
          <div className="space-y-2">
            <Label className="text-xs">결제 유형 (복수 선택)</Label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_COMMERCE_TYPES.map((t) => {
                const active = value.commerce_types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleType(t)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors",
                      active
                        ? "border-orange-500 bg-orange-500 text-white"
                        : "border-input bg-background text-foreground/70 hover:bg-muted",
                    )}
                  >
                    {COMMERCE_TYPE_LABELS[t]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 결제 방식 + 가격대 */}
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label className="text-xs">결제 방식</Label>
              <select
                className="border-input bg-background h-9 w-full rounded-lg border px-2 text-sm"
                value={value.payment_mode ?? "onsite"}
                onChange={(e) => patch({ payment_mode: e.target.value as CommercePaymentMode })}
              >
                {PAYMENT_MODES.map((m) => (
                  <option key={m} value={m}>
                    {COMMERCE_PAYMENT_MODE_LABELS[m]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">가격대 (자유 입력)</Label>
              <Input
                value={value.price_range_label ?? ""}
                onChange={(e) => patch({ price_range_label: e.target.value })}
                placeholder="예: ₩10,000 ~ ₩30,000"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* 예약·제휴 */}
          <div className="space-y-2">
            <Label className="text-xs">예약 / 제휴</Label>
            <div className="flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={value.reservation_required ?? false}
                  onChange={(e) => patch({ reservation_required: e.target.checked })}
                  className="size-3.5 accent-orange-500"
                />
                예약 필요
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={value.partner_enabled ?? false}
                  onChange={(e) => patch({ partner_enabled: e.target.checked })}
                  className="size-3.5 accent-emerald-500"
                />
                제휴 가능
              </label>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Input
                value={value.reservation_url ?? ""}
                onChange={(e) => patch({ reservation_url: e.target.value })}
                placeholder="예약 URL (선택)"
                className="rounded-xl"
              />
              <Input
                value={value.partner_name ?? ""}
                onChange={(e) => patch({ partner_name: e.target.value })}
                placeholder="제휴 매장명 (선택)"
                className="rounded-xl"
              />
            </div>
          </div>

          {/* 구매 가능 품목 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">구매 가능 품목</Label>
              <Button type="button" size="sm" variant="outline" className="h-7 gap-1" onClick={addItem}>
                <Plus className="size-3" />
                항목 추가
              </Button>
            </div>
            {(value.purchasable_items?.length ?? 0) === 0 ? (
              <p className="rounded-md bg-muted/40 px-2 py-2 text-[11px] text-muted-foreground">
                아직 추가된 품목이 없습니다.
              </p>
            ) : (
              <ul className="space-y-2">
                {value.purchasable_items!.map((item, i) => (
                  <li key={i} className="rounded-lg border border-orange-300/30 bg-background p-2.5 space-y-1.5">
                    <div className="flex items-center gap-2">
                      <Input
                        value={item.name}
                        onChange={(e) => updateItem(i, { name: e.target.value })}
                        placeholder="품목명 (예: BTS 정규앨범)"
                        className="rounded-lg text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        className="text-muted-foreground hover:text-foreground"
                        aria-label="품목 삭제"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                    <div className="grid gap-2 sm:grid-cols-2">
                      <Input
                        value={item.related_artist ?? ""}
                        onChange={(e) => updateItem(i, { related_artist: e.target.value })}
                        placeholder="관련 아티스트 (선택)"
                        className="rounded-lg text-[12px]"
                      />
                      <Input
                        value={item.related_work ?? ""}
                        onChange={(e) => updateItem(i, { related_work: e.target.value })}
                        placeholder="관련 작품 (선택)"
                        className="rounded-lg text-[12px]"
                      />
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-[11px]">
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={item.is_official ?? false}
                          onChange={(e) => updateItem(i, { is_official: e.target.checked })}
                          className="size-3.5 accent-orange-500"
                        />
                        공식 MD
                      </label>
                      <label className="flex items-center gap-1">
                        <input
                          type="checkbox"
                          checked={item.is_limited ?? false}
                          onChange={(e) => updateItem(i, { is_limited: e.target.checked })}
                          className="size-3.5 accent-pink-500"
                        />
                        기간 한정
                      </label>
                      <select
                        className="border-input bg-background h-7 rounded-md border px-1.5 text-[11px]"
                        value={item.item_type ?? ""}
                        onChange={(e) =>
                          updateItem(i, {
                            item_type: e.target.value ? (e.target.value as CommerceType) : undefined,
                          })
                        }
                      >
                        <option value="">유형 선택</option>
                        {ALL_COMMERCE_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {COMMERCE_TYPE_LABELS[t]}
                          </option>
                        ))}
                      </select>
                    </div>
                    <Input
                      value={item.note ?? ""}
                      onChange={(e) => updateItem(i, { note: e.target.value })}
                      placeholder="비고 (예: 방문 시점에 따라 재고 변동)"
                      className="rounded-lg text-[11.5px]"
                    />
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* disclaimer */}
          <div className="space-y-1.5">
            <Label className="text-xs">안내 문구 (운영·재고)</Label>
            <Textarea
              value={value.disclaimer ?? ""}
              onChange={(e) => patch({ disclaimer: e.target.value })}
              placeholder={DEFAULT_DISCLAIMER}
              rows={2}
              className="rounded-xl text-[12.5px]"
            />
            <p className="text-[10.5px] text-muted-foreground">
              비워두면 기본 안내 문구가 표시됩니다.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
