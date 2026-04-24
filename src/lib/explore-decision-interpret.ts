import type { LaunchAreaSlug } from "@/types/launch-area";

type PartySize = "solo" | "two" | "small" | "group";
type Pace = "calm" | "balanced" | "packed";

type RawLaunch = { name: string };
type RawTheme = { title: string };

/**
 * 추천 결과·요약 바에 쓰는 해석형 한 줄 (지역·테마·인원·일정·페이스).
 */
export function formatDecisionInterpretLine(
  t: (key: string, values?: Record<string, string>) => string,
  tLaunch: { raw: (slug: string) => unknown },
  tThemes: { raw: (slug: string) => unknown },
  input: {
    region: LaunchAreaSlug | "";
    theme: string;
    days: string;
    partySize: PartySize;
    pace: Pace;
  },
): string {
  const tripKey = input.days === "1" ? "tripDays1" : input.days === "2" ? "tripDays2" : "tripDays3";
  const daysLabel = t(tripKey);
  const partyLabel = t(`party_${input.partySize}`);
  const paceLabel =
    input.pace === "calm" ? t("paceCalm") : input.pace === "packed" ? t("pacePacked") : t("paceBalanced");

  if (input.region && input.theme) {
    const an = (tLaunch.raw(input.region) as RawLaunch).name;
    const tt = (tThemes.raw(input.theme) as RawTheme).title;
    return t("decisionInterpretBoth", {
      area: an,
      theme: tt,
      party: partyLabel,
      days: daysLabel,
      pace: paceLabel,
    });
  }
  if (input.region) {
    const an = (tLaunch.raw(input.region) as RawLaunch).name;
    return t("decisionInterpretArea", {
      area: an,
      party: partyLabel,
      days: daysLabel,
      pace: paceLabel,
    });
  }
  if (input.theme) {
    const tt = (tThemes.raw(input.theme) as RawTheme).title;
    return t("decisionInterpretTheme", {
      theme: tt,
      party: partyLabel,
      days: daysLabel,
      pace: paceLabel,
    });
  }
  return t("decisionInterpretFallback", {
    party: partyLabel,
    days: daysLabel,
    pace: paceLabel,
  });
}
