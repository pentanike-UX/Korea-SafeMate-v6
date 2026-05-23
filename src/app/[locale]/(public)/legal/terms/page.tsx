/**
 * M07 — Legal: Terms of Service
 * IA §4.1 M07 · 릴리즈 [P]
 * 본문은 법무 검토 전 초안 (LegalDocument 배너 참고).
 */
import { getLocale } from "next-intl/server";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { BRAND } from "@/lib/constants";

const LAST_UPDATED = "2026-05-23";

const SECTIONS_KO: LegalSection[] = [
  {
    heading: "목적",
    paragraphs: [
      "본 약관은 하루(이하 '서비스')가 제공하는 여행 루트 큐레이션·중개 서비스의 이용 조건과 절차, 이용자와 서비스의 권리·의무를 규정합니다.",
    ],
  },
  {
    heading: "용어 정의",
    paragraphs: [
      "'여행자'란 서비스를 통해 루트를 요청·구매하는 이용자를 말합니다.",
      "'하루이'란 서비스의 검수를 거쳐 루트를 설계·납품하는 현지 큐레이터를 말합니다.",
      "'루트'란 하루이가 제작해 여행자에게 제공하는 장소·동선·현장 메모의 묶음을 말합니다.",
    ],
  },
  {
    heading: "서비스의 성격",
    paragraphs: [
      "서비스는 여행자와 하루이를 연결하고 루트 콘텐츠의 거래를 중개합니다. 동행·가이드 서비스가 아니며, 현장 안전·이동·예약 등은 여행자 본인의 책임 하에 이루어집니다.",
    ],
  },
  {
    heading: "결제 및 환불",
    paragraphs: [
      "여행자는 루트 잠금 해제 시점에 정해진 금액을 결제합니다.",
      "환불은 납품 전·후 단계 및 수정 요청 정책에 따라 차등 적용됩니다. 구체적 기준은 정식 출시본에서 확정됩니다.",
    ],
  },
  {
    heading: "콘텐츠 및 지식재산권",
    paragraphs: [
      "하루이가 제작한 루트의 저작권은 별도 정함이 없는 한 하루이에게 귀속하며, 여행자는 개인적 이용 목적으로만 사용할 수 있습니다.",
      "이용자는 타인의 권리를 침해하거나 허위·불법 콘텐츠를 게시할 수 없습니다.",
    ],
  },
  {
    heading: "책임의 제한",
    paragraphs: [
      "서비스는 하루이가 제공한 루트의 정확성·적합성을 보증하지 않으며, 루트 이용 중 발생한 손해에 대해 관련 법령이 허용하는 범위 내에서 책임을 제한합니다.",
    ],
  },
  {
    heading: "약관의 변경",
    paragraphs: [
      "서비스는 필요 시 약관을 변경할 수 있으며, 변경 시 사전 공지합니다.",
    ],
  },
];

const SECTIONS_EN: LegalSection[] = [
  {
    heading: "Purpose",
    paragraphs: [
      "These Terms govern the conditions and procedures for using the travel route curation and brokerage service provided by haru (the 'Service'), and the rights and obligations of users and the Service.",
    ],
  },
  {
    heading: "Definitions",
    paragraphs: [
      "'Traveler' means a user who requests or purchases routes through the Service.",
      "'Haruee' means a local curator who designs and delivers routes after the Service's review.",
      "'Route' means the bundle of places, itinerary, and on-the-ground notes created by a haruee and provided to a traveler.",
    ],
  },
  {
    heading: "Nature of the Service",
    paragraphs: [
      "The Service connects travelers with haruee and brokers transactions of route content. It is not a companion or guide service; on-site safety, transportation, and reservations are the traveler's own responsibility.",
    ],
  },
  {
    heading: "Payment and Refunds",
    paragraphs: [
      "Travelers pay the set amount when unlocking a route.",
      "Refunds apply differently depending on the pre/post-delivery stage and revision policy. Specific criteria will be finalized in the launch version.",
    ],
  },
  {
    heading: "Content and Intellectual Property",
    paragraphs: [
      "Unless otherwise specified, copyright in routes created by a haruee belongs to that haruee, and travelers may use them for personal purposes only.",
      "Users may not post content that infringes others' rights or is false or unlawful.",
    ],
  },
  {
    heading: "Limitation of Liability",
    paragraphs: [
      "The Service does not warrant the accuracy or suitability of routes provided by haruee, and limits liability for damages arising from route use to the extent permitted by applicable law.",
    ],
  },
  {
    heading: "Changes to Terms",
    paragraphs: ["The Service may change these Terms when necessary, with prior notice."],
  },
];

export async function generateMetadata() {
  const locale = await getLocale();
  const isKo = locale === "ko";
  return {
    title: isKo ? `이용약관 | ${BRAND.name}` : `Terms of Service | ${BRAND.name}`,
    description: isKo ? "하루 서비스 이용약관" : "haru Terms of Service",
  };
}

export default async function TermsPage() {
  const locale = await getLocale();
  const isKo = locale === "ko";
  return (
    <LegalDocument
      isKo={isKo}
      title={isKo ? "이용약관" : "Terms of Service"}
      lastUpdated={LAST_UPDATED}
      intro={
        isKo
          ? "하루 서비스를 이용해 주셔서 감사합니다. 서비스 이용 전 본 약관을 확인해 주세요."
          : "Thank you for using haru. Please review these Terms before using the Service."
      }
      sections={isKo ? SECTIONS_KO : SECTIONS_EN}
    />
  );
}
