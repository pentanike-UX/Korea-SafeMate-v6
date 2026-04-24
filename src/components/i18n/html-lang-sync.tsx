"use client";

import { useLocale } from "next-intl";
import { useEffect } from "react";

/** Syncs `<html lang>` with active next-intl locale (root layout stays `en` until hydration). */
export function HtmlLangSync() {
  const locale = useLocale();
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);
  return null;
}
