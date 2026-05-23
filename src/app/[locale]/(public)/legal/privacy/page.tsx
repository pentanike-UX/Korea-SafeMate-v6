/**
 * M07 — Legal: Privacy Policy
 * IA §4.1 M07 · 릴리즈 [P]
 * 본문은 법무 검토 전 초안 (LegalDocument 배너 참고).
 */
import { getLocale } from "next-intl/server";
import { LegalDocument, type LegalSection } from "@/components/legal/legal-document";
import { BRAND } from "@/lib/constants";

const LAST_UPDATED = "2026-05-23";

const SECTIONS_KO: LegalSection[] = [
  {
    heading: "수집하는 개인정보 항목",
    paragraphs: [
      "회원가입·로그인 시: 이메일, 인증 제공자 식별자(소셜 로그인 사용 시), 프로필 정보.",
      "서비스 이용 시: 루트 요청·결제 내역, 메시지, 리뷰, 접속 로그.",
    ],
  },
  {
    heading: "개인정보의 이용 목적",
    paragraphs: [
      "회원 식별·인증, 루트 중개·납품, 결제 처리, 고객 문의 응대, 서비스 품질 개선 및 부정 이용 방지를 위해 이용합니다.",
    ],
  },
  {
    heading: "개인정보의 보관 및 파기",
    paragraphs: [
      "관련 법령이 정한 기간 또는 이용 목적 달성 시까지 보관하며, 목적 달성 후 지체 없이 파기합니다.",
    ],
  },
  {
    heading: "제3자 제공 및 처리위탁",
    paragraphs: [
      "원활한 서비스 제공을 위해 결제 대행, 인증, 클라우드 인프라 등 일부 업무를 외부에 위탁할 수 있으며, 이 경우 수탁자와 보호 의무를 계약으로 정합니다.",
      "법령에 근거하거나 이용자 동의가 있는 경우를 제외하고 개인정보를 제3자에게 제공하지 않습니다.",
    ],
  },
  {
    heading: "이용자의 권리",
    paragraphs: [
      "이용자는 자신의 개인정보 열람·정정·삭제·처리정지를 요청할 수 있으며, 계정 설정 또는 문의를 통해 행사할 수 있습니다.",
    ],
  },
  {
    heading: "쿠키 및 추적 기술",
    paragraphs: [
      "서비스는 로그인 유지·이용 분석을 위해 쿠키 및 유사 기술을 사용할 수 있으며, 브라우저 설정으로 거부할 수 있습니다.",
    ],
  },
  {
    heading: "문의처",
    paragraphs: [
      "개인정보 관련 문의는 서비스 내 고객 문의 채널을 통해 접수합니다.",
    ],
  },
];

const SECTIONS_EN: LegalSection[] = [
  {
    heading: "Information We Collect",
    paragraphs: [
      "At sign-up/login: email, authentication provider identifier (for social login), and profile information.",
      "During use: route requests and payment history, messages, reviews, and access logs.",
    ],
  },
  {
    heading: "Purpose of Use",
    paragraphs: [
      "We use information to identify and authenticate members, broker and deliver routes, process payments, respond to inquiries, improve service quality, and prevent abuse.",
    ],
  },
  {
    heading: "Retention and Deletion",
    paragraphs: [
      "We retain information for the period required by applicable law or until the purpose is fulfilled, then delete it without undue delay.",
    ],
  },
  {
    heading: "Third-Party Sharing and Processing",
    paragraphs: [
      "To provide the service smoothly, we may entrust some operations (payment processing, authentication, cloud infrastructure) to external parties, in which case protection obligations are set by contract.",
      "We do not provide personal information to third parties except as required by law or with user consent.",
    ],
  },
  {
    heading: "Your Rights",
    paragraphs: [
      "You may request access, correction, deletion, or suspension of processing of your personal information through account settings or by contacting us.",
    ],
  },
  {
    heading: "Cookies and Tracking",
    paragraphs: [
      "The Service may use cookies and similar technologies to maintain login and analyze usage; you can decline via browser settings.",
    ],
  },
  {
    heading: "Contact",
    paragraphs: ["Privacy inquiries are received through the in-service customer inquiry channel."],
  },
];

export async function generateMetadata() {
  const locale = await getLocale();
  const isKo = locale === "ko";
  return {
    title: isKo ? `개인정보처리방침 | ${BRAND.name}` : `Privacy Policy | ${BRAND.name}`,
    description: isKo ? "하루 개인정보처리방침" : "haru Privacy Policy",
  };
}

export default async function PrivacyPage() {
  const locale = await getLocale();
  const isKo = locale === "ko";
  return (
    <LegalDocument
      isKo={isKo}
      title={isKo ? "개인정보처리방침" : "Privacy Policy"}
      lastUpdated={LAST_UPDATED}
      intro={
        isKo
          ? "하루는 이용자의 개인정보를 중요하게 생각하며, 관련 법령을 준수합니다."
          : "haru values your privacy and complies with applicable laws."
      }
      sections={isKo ? SECTIONS_KO : SECTIONS_EN}
    />
  );
}
