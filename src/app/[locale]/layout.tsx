import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { HtmlLangSync } from "@/components/i18n/html-lang-sync";
import { routing, type AppLocale } from "@/i18n/routing";
import { ToastProvider } from "@/components/ui/toast";
import { InboundNotifyBridge } from "@/components/layout/inbound-notify-bridge";
import { PushSubscriptionAutoSubscribe } from "@/components/layout/push-subscription-auto-subscribe";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!routing.locales.includes(locale as AppLocale)) {
    notFound();
  }
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <HtmlLangSync />
      <ToastProvider>
        <InboundNotifyBridge />
        <PushSubscriptionAutoSubscribe />
        {children}
      </ToastProvider>
    </NextIntlClientProvider>
  );
}
