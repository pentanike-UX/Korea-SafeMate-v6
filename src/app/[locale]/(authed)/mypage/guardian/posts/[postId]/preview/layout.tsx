import { NextIntlClientProvider } from "next-intl";
import en from "../../../../../../../../../messages/en.json";

export default function MypageGuardianPostPreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <NextIntlClientProvider locale="en" messages={en as Record<string, unknown>}>
      {children}
    </NextIntlClientProvider>
  );
}
