# 하루 컬러 시스템 (v2026-05)

이 문서는 현재 코드베이스의 색상 토큰을 정리한 **운영 가이드**입니다. 정의 단일 소스는 `src/app/globals.css`이며, 신규 컴포넌트는 본 문서의 권장 토큰을 사용합니다.

> **현 상태 요약**: 두 토큰 체계(A·B)가 한 `:root` 블록 안에 공존하며, **B가 A를 덮어쓰고** 있습니다. 다크모드에서는 매핑이 다릅니다. 정리 전까지는 §7 권장 토큰만 사용하세요.

---

## 1. 두 토큰 체계 개요

### System A — Foundation (shadcn 친화)

브랜드·텍스트·표면·테두리·상태를 의미 중심으로 정의합니다.

| 그룹 | 토큰 |
|---|---|
| Brand | `--brand-primary`, `--brand-primary-hover`, `--brand-primary-pressed`, `--brand-primary-soft`, `--brand-primary-soft-2` |
| Support (legacy) | `--brand-trust-blue`, `--brand-trust-blue-hover`, `--brand-trust-blue-soft` (현재는 모두 `#22C55E` 그린으로 통일) |
| Accent (점진 사용) | `--accent-pink`(#e11d48), `--accent-purple-blue`(#4f46e5) |
| Text | `--text-strong`, `--text-primary`, `--text-secondary`, `--text-muted`, `--text-on-brand` |
| Surface | `--bg-page`, `--bg-surface`, `--bg-surface-subtle`, `--bg-elevated` |
| Border | `--border-default`, `--border-strong`, `--border-focus` |
| Status | `--success/-soft`, `--warning/-soft`, `--error/-soft`, `--info/-soft` |
| Gradient | `--gradient-brand`, `--gradient-brand-soft` |
| Shadow | `--shadow-sm`, `--shadow-md`, `--shadow-brand` |

### System B — Startup UX v1 ("Fresh / Light / Trust / Friendly")

색상 스케일(900→100)로 더 세분화된 팔레트. 데이터 시각화·세분 상태 표현에 사용.

| 그룹 | 토큰 |
|---|---|
| Primary green 스케일 | `--primary-green-900..100` (#0f3d2e → #f0fdf4, 9단) |
| Secondary accents | `--accent-mint`(#86efac), `--accent-sky`(#38bdf8), `--accent-sunshine`(#facc15), `--accent-coral`(#fb7185), `--accent-lavender`(#a78bfa) |
| Neutrals (Tailwind Gray) | `--gray-900..100` |
| Surface | `--bg`, `--bg-card`, `--bg-sunken`, `--bg-dark`, `--bg-dark-soft` |
| Ink | `--ink`(gray-900), `--ink-muted`(gray-700), `--ink-soft`(gray-500), `--ink-whisper`(gray-400) |
| Brand alias (CTA) | `--accent-ksm`(=green-600), `--accent-dark`(=green-700), `--accent-soft`(=green-200), `--accent-whisper`(=green-100) |
| Gold / OK | `--gold`(=sunshine), `--ok`(=green-700) |
| Line | `--line`(=gray-200), `--line-soft`(=gray-100), `--line-whisper`(#f9fafb) |
| Semantic | `--semantic-success/info/warning/error` |

---

## 2. Shadcn 시맨틱 브리지 (중요)

`globals.css`의 `:root` 블록은 shadcn 시맨틱 토큰을 **두 번** 재정의합니다. 같은 셀렉터에 같은 토큰이 두 번 선언되면 **나중 것이 이깁니다**.

### 라이트 모드 — B가 최종 적용

```css
/* line 166–188 — System A 매핑(먼저, 사용 안 됨) */
--primary: var(--brand-primary);     /* 그린 */
--background: var(--bg-page);        /* #f4f4f5 */
--card: var(--bg-surface);           /* #ffffff */
--muted: var(--bg-surface-subtle);   /* #fafafa */
--muted-foreground: var(--text-muted);

/* line 280–289 — System B 매핑(나중, 실제 적용) */
--background: var(--bg);             /* #ffffff */
--foreground: var(--ink);            /* gray-900 */
--card: var(--bg-card);              /* #ffffff */
--muted: var(--bg-sunken);           /* gray-100 */
--muted-foreground: var(--ink-muted);/* gray-700 */
--primary: var(--ink);               /* ⚠️ gray-900 — 브랜드 그린 아님! */
--primary-foreground: var(--bg);     /* 흰색 */
```

**라이트 모드의 `--primary`는 브랜드 그린이 아니라 잉크(짙은 회색)** 입니다. `bg-primary` 유틸이 그린이 아니라 회색으로 칠해지는 이유입니다. 의도된 것이 맞다면 잉크 CTA(짙은 버튼) UX를 위한 선택이고, 의도가 아니라면 정리 필요.

### 다크 모드 — A가 적용

```css
/* line 336–348 — System A 매핑(다크) */
--primary: var(--brand-primary);   /* 그린 */
--background: var(--bg-page);      /* #0B1110 */
--card: var(--bg-surface);         /* #18181b */
...

/* line 374–388 — System B의 다크 표면만 재정의(시맨틱은 안 덮음) */
--bg: #111827;
--bg-card: #1f2937;
--ink: #f9fafb;
...
```

**다크 모드의 `--primary`는 브랜드 그린**입니다 → 라이트/다크에서 `bg-primary`가 가리키는 의미가 다릅니다.

| 토큰 | Light | Dark |
|---|---|---|
| `--primary` | `--ink` (gray-900) | `--brand-primary` (#22C55E) |
| `--background` | `--bg` (#ffffff) | `--bg-page` (#0B1110) |
| `--card` | `--bg-card` (#ffffff) | `--bg-surface` (#18181b) |
| `--muted` | `--bg-sunken` (gray-100) | `--bg-surface-subtle` (#27272a) |
| `--muted-foreground` | `--ink-muted` (gray-700) | `--text-muted` (#71717a) |
| `--secondary` | `--brand-primary-soft` (System A — A의 1차 매핑이 B에 덮이지 않은 케이스) | `--brand-primary-soft` (rgba 0.12) |
| `--accent` | `--brand-primary-soft-2` (System A) | `--brand-primary-soft-2` (rgba 0.18) |
| `--destructive` | `--error` (#ef4444) | `#f87171` |
| `--border` | `--line` (gray-200) | `--border-default` (#3f3f46) |

---

## 3. Tailwind 4 컬러 유틸 매핑

`@theme inline` 블록(line 7–86)이 Tailwind 4 컬러 유틸의 토큰 소스입니다.

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-muted: var(--muted);
  --color-primary: var(--primary);
  /* ... */
  --color-bg:           var(--bg);
  --color-bg-card:      var(--bg-card);
  --color-bg-sunken:    var(--bg-sunken);
  --color-ink:          var(--ink);
  --color-ink-muted:    var(--ink-muted);
  --color-accent-ksm:   var(--accent-ksm);
  --color-line:         var(--line);
  --color-brand-primary-soft: var(--brand-primary-soft);
  --color-text-strong:  var(--text-strong);
  --color-info/info-soft/success/success-soft: ...
}
```

이로 인해 다음 유틸이 모두 작동합니다:

- shadcn 표준: `bg-background`, `bg-card`, `bg-muted`, `bg-primary`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring-ring` 등
- System B 직접: `bg-bg`, `bg-bg-card`, `bg-bg-sunken`, `text-ink`, `text-ink-muted`, `text-accent-ksm`, `border-line`
- System A 직접: `bg-brand-primary-soft`, `text-text-strong`, `bg-success-soft`

---

## 4. 라디우스 / 그림자 토큰

### Radius

```css
--radius-sm: 8px;
--radius-md: 12px;
--radius-lg: 16px;
--radius-xl: 12px;   /* ⚠️ md와 동일 */
--radius-2xl: 16px;  /* ⚠️ lg와 동일 */
--radius-3xl: 18px;
--radius-4xl: 20px;
--radius:    0.75rem; /* shadcn 기본 — Card 등이 참조 */
```

> `xl=md`, `2xl=lg` 충돌. 신규 코드는 sm/md/lg/3xl/4xl만 사용 권장.

### Shadow

```css
/* Light */
--shadow-sm:    0 1px 2px rgba(0,0,0,.05), 0 4px 12px rgba(0,0,0,.04);
--shadow-md:    0 8px 24px rgba(0,0,0,.08);
--shadow-brand: 0 8px 20px rgba(0,0,0,.12);
--shadow-card:  0 4px 12px rgba(0,0,0,.05); /* System B 별칭 */

/* Dark */
--shadow-sm:    0 4px 14px rgba(0,0,0,.35);
--shadow-md:    0 14px 36px rgba(0,0,0,.45);
--shadow-brand: 0 8px 24px rgba(0,0,0,.35);
```

---

## 5. 사용 빈도 (코드 통계)

`var(--…)` 직접 호출 수 (`src/**/*.tsx`):

```
157  --radius-md           137  --shadow-sm           119  --brand-primary
 94  --brand-trust-blue     50  --text-strong          32  --radius-xl
 28  --shadow-md            27  --bg-page              25  --radius-lg
 24  --brand-trust-blue-soft 20 --text-on-brand        15  --brand-primary-soft
 13  --muted                12  --shadow-brand         10  --radius-sm
  8  --border                6  --link-color            5  --text-primary, --success
```

Tailwind 시맨틱 유틸 사용 수:

| 패턴 | 건수 |
|---|---|
| `bg-card / bg-muted / text-foreground / text-muted-foreground / bg-primary / border-border` 등 shadcn 시맨틱 | **2,198** |
| `bg-bg / text-ink / border-line / text-accent-ksm` 등 System B 직접 | **291** |
| Tailwind 팔레트 직접 (`emerald-*`, `amber-*`, `rose-*`, `violet-*`, `sky-*`) | **195** |

→ **현재 베이스는 shadcn 시맨틱**(`bg-card`, `text-foreground` 등). 신규 코드도 동일 패턴 유지.

---

## 6. 의도(Intent) → 권장 토큰

> **신규 컴포넌트는 본 표만 보면 됩니다.** 시맨틱 의도를 코드에 직접 표현하세요.

### 표면 (Surface)

| 의도 | 추천 | 사용 예 |
|---|---|---|
| 페이지 배경 | `bg-background` | `<main>`, 루트 wrapper |
| 카드 표면 | `bg-card` | Card, Sheet, Dialog |
| 살짝 가라앉은 박스(읽기 영역, 칩 배경) | `bg-muted` | Skeleton, 코드블록, 칩 |
| 더 약한 톤(아바타 빈자리, 비활성 카드) | `bg-muted/40 ~ /60` | 보조 표면 |

### 텍스트

| 의도 | 추천 | 비고 |
|---|---|---|
| 본문 기본 | `text-foreground` | `--ink`(L) / `--text-primary`(D) |
| 보조·메타 | `text-muted-foreground` | 캡션·라벨·시간 |
| 강조 헤딩(흰 배경 위) | `text-foreground` 또는 직접 `text-text-strong` | (대부분 `text-foreground`로 충분) |
| 브랜드 위 텍스트(그린 CTA 위) | `text-[var(--text-on-brand)]` | 흰색 |

### 브랜드 / CTA

| 의도 | 추천 | 비고 |
|---|---|---|
| 1차 브랜드 컬러 (배경/아이콘 등) | `bg-[var(--brand-primary)]` / `text-[var(--brand-primary)]` | `bg-primary` 사용 시 라이트모드에서 잉크 색이 됨에 주의 (§2) |
| 1차 CTA 버튼 | shadcn `<Button>` 기본 (`size`/`variant="default"`) | 내부적으로 위 토큰 사용 |
| 보조 배경 톤(브랜드 향) | `bg-[var(--brand-primary-soft)]` 또는 `bg-secondary` (라이트만 안전) | `secondary`는 라이트=`--brand-primary-soft`, 다크=동일 — 사용 가능 |
| Accent (라일락·핑크 등) | `text-[var(--accent-purple-blue)]` 같이 직접 변수 | 점진 사용 |

### 테두리 / 포커스

| 의도 | 추천 |
|---|---|
| 기본 테두리 | `border-border` |
| 입력 필드 테두리 | `border-input` |
| 강한 테두리 (강조 경계) | `border-[var(--border-strong)]` |
| 포커스 링 | `focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2` |

### 상태 (Status)

| 상태 | Foreground | Background | 비고 |
|---|---|---|---|
| Success | `text-[var(--success)]` | `bg-[var(--success-soft)]` | 그린 계열 |
| Info | `text-[var(--info)]` | `bg-[var(--info-soft)]` | 스카이블루 |
| Warning | `text-[var(--warning)]` 또는 `text-amber-700` | `bg-[var(--warning-soft)]` | 노랑/앰버 |
| Error / Destructive | `text-destructive` | `bg-destructive/10` | shadcn 표준 |

> Tailwind 팔레트(`emerald-*`/`amber-*`/`rose-*`) 직접 사용은 OK이지만 **다크모드 대비 페어를 명시**: `text-emerald-700 dark:text-emerald-300` 처럼.

### Online 상태(가디언 등)

- 기본: `bg-emerald-500` + `dark:bg-emerald-400` (점)
- 텍스트 배지: `text-emerald-700 dark:text-emerald-300`, 배경 `bg-emerald-500/12 dark:bg-emerald-400/15`

이미 `OnlineStatusBadge` 컴포넌트에 통합되어 있음(`src/components/guardians/guardian-online-status.tsx`).

---

## 7. 다크 모드 패턴

`html.dark` 클래스 토글로 동작 (`themeInitScript` in `src/app/layout.tsx`). 기본 원칙:

1. **시맨틱 토큰 사용 시 자동 대응**: `bg-card`, `text-foreground`, `border-border` 등은 모드 매핑이 자동 적용.
2. **Tailwind 팔레트 직접 사용 시 페어 명시**: `text-amber-700 dark:text-amber-300`처럼 항상 양쪽 지정.
3. **반투명 배경 권장**: `bg-emerald-500/12 dark:bg-emerald-400/15` — 색온도·대비를 분리해 가독성 확보.

---

## 8. 알려진 충돌 / 정리 후보

1. **`--primary`가 라이트는 잉크, 다크는 브랜드** — 의미 불일치. 결정 후 한 방향으로 정리:
   - 옵션 A: 라이트도 `--brand-primary`로 통일 (shadcn 정석)
   - 옵션 B: 다크도 `--ink`로 통일 (현 라이트 디자인 유지)
2. **`--radius-xl`이 `--radius-md`와 동일, `--radius-2xl`이 `--radius-lg`와 동일** — 신규 코드는 `xl`/`2xl` 회피.
3. **`--brand-trust-blue` 네이밍 잔재** — 모두 그린(`#22C55E`)이지만 변수명이 'blue'. 점진 deprecation 권장(검색·교체 비용 큼).
4. **`:root` 블록 두 번 매핑** — 가독성 저해. 단일 진실 블록으로 통합 권장(라이트는 옵션 A/B 결정 후).
5. **System A와 B 중복** — `--success`(System A) 와 `--semantic-success`(System B)가 동일값. 하나로 통합 권장.
6. **`OnlineStatus` 등 상태별 직접 팔레트 사용** — `--status-online`/`--status-recently` 같은 시맨틱 토큰 신설 시 다크모드 일관성 강화 가능.

---

## 9. 참고: 그라데이션·히어로 배경 유틸

`@layer utilities`에 정의된 페이지·히어로용 유틸 (라이트/다크 페어 포함):

- `.bg-hero-mesh` / `.bg-hero-mesh-subtle` — 공개 페이지 히어로
- `.bg-hero-atmosphere` — 어두운 영화/뮤직 컨텍스트
- `.bg-hero-42` — 앱 스타일 라이트 밴드
- `.bg-cta-brand` — 1차 CTA 그라데이션(흰 텍스트 위)
- `.bg-booking-progress-fill` — 진행바
- `.bg-quick-start` — 빠른 시작 패널 배경

---

## 10. 변경 로그

| 일자 | 변경 |
|---|---|
| 2026-05-27 | 초판. 두 시스템 공존 명시·시맨틱 매핑 충돌 진단·권장 토큰 표 정리. |

---

## 11. 빠른 체크리스트 (신규 컴포넌트 작성 시)

- [ ] 표면은 `bg-card` / `bg-muted` 사용?
- [ ] 본문 텍스트는 `text-foreground` / `text-muted-foreground`?
- [ ] 브랜드 그린은 `bg-[var(--brand-primary)]` 직접 사용? (`bg-primary`는 라이트 모드 잉크임 — 주의)
- [ ] 테두리는 `border-border` 또는 `border-input`?
- [ ] 상태 컬러는 시맨틱 토큰(`--success/-soft` 등) 또는 dark 페어를 명시한 Tailwind 팔레트?
- [ ] 그림자는 `shadow-[var(--shadow-sm)]` / `shadow-[var(--shadow-md)]`?
- [ ] 라디우스는 `rounded-[var(--radius-md)]` / `rounded-2xl`(=16px) / `rounded-3xl`(=18px)?
