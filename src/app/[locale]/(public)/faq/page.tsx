/**
 * M06 — FAQ
 * IA §4.1 M06 · 릴리즈 [P]
 */
import { getLocale } from "next-intl/server";
import { FaqContent } from "@/components/faq/faq-content";
import { BRAND } from "@/lib/constants";

export async function generateMetadata() {
  const locale = await getLocale();
  const isKo = locale === "ko";
  const title = isKo ? `자주 묻는 질문 | ${BRAND.name}` : `FAQ | ${BRAND.name}`;
  return {
    title,
    description: isKo
      ? "하루 서비스 이용·결제·하루이 활동에 대한 자주 묻는 질문"
      : "Frequently asked questions about haru — usage, payment, and becoming a haruee.",
  };
}

export default async function FaqPage() {
  const locale = await getLocale();
  return <FaqContent locale={locale} />;
}
