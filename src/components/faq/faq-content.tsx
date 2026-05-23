"use client";

import { useState } from "react";
import { Link } from "@/i18n/navigation";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface QA {
  q: string;
  a: string;
}
interface FaqSection {
  category: string;
  items: QA[];
}

const FAQ_KO: FaqSection[] = [
  {
    category: "서비스 기본",
    items: [
      {
        q: "하루는 어떤 서비스인가요?",
        a: "서울을 잘 아는 현지 '하루이'가 K-드라마·K-팝·영화 속 장소를 엮은 하루 여행 루트를 만들어 주고, 해외 여행자가 그 루트를 받아 직접 다니는 서비스입니다. 동행이 아니라 '현지인이 짜준 진짜 동선'을 받는 것이 핵심입니다.",
      },
      {
        q: "하루이(Guardian)는 누구인가요?",
        a: "서울에 거주하며 검증을 거친 현지 큐레이터입니다. 자신만의 동네·취향·콘텐츠 지식으로 루트를 설계하고, 여행자의 요청에 맞춰 맞춤 루트를 납품합니다.",
      },
      {
        q: "동행 서비스인가요?",
        a: "아니요. 하루는 '루트와 현장 메모'를 전달하는 서비스입니다. 여행자는 받은 루트를 본인 일정에 맞춰 자유롭게 다닙니다. 별도 동행이 필요한 경우는 추후 단계에서 검토됩니다.",
      },
    ],
  },
  {
    category: "이용 방법",
    items: [
      {
        q: "어떻게 시작하나요?",
        a: "탐색에서 하루이와 샘플 루트를 둘러본 뒤, 마음에 드는 하루이에게 맞춤 루트를 요청하거나 공개 샘플 루트를 바로 받아볼 수 있습니다.",
      },
      {
        q: "맞춤 루트는 얼마나 걸리나요?",
        a: "하루이가 요청을 확인하고 루트를 설계해 납품합니다. 소요 시간은 하루이마다 다르며, 요청 상태 페이지에서 진행 상황을 확인할 수 있습니다.",
      },
      {
        q: "루트를 받은 뒤 수정할 수 있나요?",
        a: "정해진 횟수 안에서 수정 요청이 가능합니다. 받은 루트가 기대와 다르면 수정 요청을 보내 하루이가 다시 다듬도록 할 수 있습니다.",
      },
    ],
  },
  {
    category: "결제·환불",
    items: [
      {
        q: "결제는 어떻게 하나요?",
        a: "루트 잠금 해제 시점에 결제합니다. 현재 데모 환경은 모의 결제이며, 정식 출시 시 안전한 결제 수단이 연결됩니다.",
      },
      {
        q: "환불 정책은 어떻게 되나요?",
        a: "납품 전·후 단계에 따라 환불 기준이 다릅니다. 자세한 내용은 이용약관을 참고하세요.",
      },
    ],
  },
  {
    category: "하루이로 활동하기",
    items: [
      {
        q: "하루이가 되려면 어떻게 하나요?",
        a: "하루이 신청 페이지에서 지원하면 검수를 거쳐 활동을 시작할 수 있습니다. 서울 거주·콘텐츠 지식·소통 능력이 주요 검토 요소입니다.",
      },
      {
        q: "수익은 어떻게 정산되나요?",
        a: "루트 납품·판매에 따라 수익이 적립되며, 수익 페이지에서 내역을 확인할 수 있습니다.",
      },
    ],
  },
];

const FAQ_EN: FaqSection[] = [
  {
    category: "Basics",
    items: [
      {
        q: "What is haru?",
        a: "Local Seoul curators ('haruee') build day-routes inspired by K-drama, K-pop, and film locations, and international travelers receive those routes to explore on their own. The core is getting a real local-built itinerary — not a guided tour.",
      },
      {
        q: "Who are the haruee (guardians)?",
        a: "Verified local curators living in Seoul. They design routes from their own neighborhood knowledge, taste, and content expertise, and deliver custom routes based on traveler requests.",
      },
      {
        q: "Is this a companion/guide service?",
        a: "No. haru delivers routes and on-the-ground notes. Travelers follow the received route freely on their own schedule. In-person companionship may be considered in a later phase.",
      },
    ],
  },
  {
    category: "How it works",
    items: [
      {
        q: "How do I start?",
        a: "Browse haruee and sample routes in Explore, then request a custom route from a haruee you like, or unlock a public sample route directly.",
      },
      {
        q: "How long does a custom route take?",
        a: "The haruee reviews your request and designs the route before delivering. Turnaround varies by haruee; track progress on your request status page.",
      },
      {
        q: "Can I request changes after receiving a route?",
        a: "Yes, within a set number of revisions. If the delivered route isn't what you expected, send a revision request and the haruee will refine it.",
      },
    ],
  },
  {
    category: "Payment & refunds",
    items: [
      {
        q: "How does payment work?",
        a: "You pay when unlocking a route. The current demo uses mock payment; a secure payment method will be connected at launch.",
      },
      {
        q: "What is the refund policy?",
        a: "Refund terms differ depending on the pre/post-delivery stage. See the Terms of Service for details.",
      },
    ],
  },
  {
    category: "Becoming a haruee",
    items: [
      {
        q: "How do I become a haruee?",
        a: "Apply through the haruee application page. After review, you can start curating. Living in Seoul, content knowledge, and communication are key factors.",
      },
      {
        q: "How are earnings settled?",
        a: "Earnings accrue from route deliveries and sales, viewable on your earnings page.",
      },
    ],
  },
];

function FaqAccordion({ sections }: { sections: FaqSection[] }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="flex flex-col gap-10">
      {sections.map((section) => (
        <div key={section.category}>
          <h2 className="mb-4 font-serif text-xl font-semibold text-ink sm:text-2xl">
            {section.category}
          </h2>
          <div className="flex flex-col gap-2">
            {section.items.map((item) => {
              const key = `${section.category}-${item.q}`;
              const isOpen = open === key;
              return (
                <div
                  key={key}
                  className="overflow-hidden rounded-[var(--radius-lg)] border border-line bg-bg-card"
                >
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : key)}
                    className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-ink sm:text-[15px]">{item.q}</span>
                    <ChevronDown
                      className={cn(
                        "size-4 shrink-0 text-ink-soft transition-transform",
                        isOpen && "rotate-180",
                      )}
                      aria-hidden
                    />
                  </button>
                  {isOpen ? (
                    <p className="border-t border-line-soft px-4 py-3.5 text-sm leading-relaxed text-ink-muted">
                      {item.a}
                    </p>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

export function FaqContent({ locale }: { locale: string }) {
  const isKo = locale === "ko";
  const sections = isKo ? FAQ_KO : FAQ_EN;

  return (
    <div className="min-h-screen bg-bg">
      <section className="border-b border-line bg-bg-card">
        <div className="page-container py-16 md:py-20">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-ink-soft">
            {isKo ? "자주 묻는 질문" : "Help Center"}
          </p>
          <h1 className="font-serif text-4xl font-semibold text-ink sm:text-5xl">
            {isKo ? "무엇이든 물어보세요" : "Frequently Asked Questions"}
          </h1>
        </div>
      </section>

      <section className="page-container py-12 md:py-16">
        <div className="max-w-2xl">
          <FaqAccordion sections={sections} />
        </div>

        <div className="mt-12 max-w-2xl rounded-[var(--radius-lg)] border border-line bg-bg-sunken px-5 py-5">
          <p className="text-sm text-ink-muted">
            {isKo
              ? "원하는 답을 못 찾으셨나요? 하루이에게 직접 문의하거나 탐색에서 더 둘러보세요."
              : "Didn't find what you were looking for? Ask a haruee directly or keep browsing Explore."}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Link
              href="/explore"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-accent-ksm px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-dark"
            >
              {isKo ? "탐색하기" : "Explore"} →
            </Link>
            <Link
              href="/how-it-works"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-line bg-bg-card px-5 py-2.5 text-sm font-semibold text-ink transition-colors hover:bg-bg-sunken"
            >
              {isKo ? "이용 방법" : "How it works"} →
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
