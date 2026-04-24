import type {
  BookingHandoffChannel,
  BookingInterestId,
  BookingSupportNeedId,
  ServiceTypeCode,
} from "@/types/domain";

export const BOOKING_STEP_LABELS = [
  "Service",
  "When & where",
  "Your needs",
  "Contact handoff",
  "Review",
] as const;

export const TRAVELER_USER_TYPE_OPTIONS = [
  { value: "foreign_traveler" as const, label: "Foreign traveler", hint: "Visiting from abroad" },
  { value: "korean_traveler" as const, label: "Korean traveler", hint: "Domestic trip / local discovery" },
];

export const LANGUAGE_OPTIONS = [
  { value: "English", label: "English" },
  { value: "Korean", label: "한국어 (Korean)" },
  { value: "Japanese", label: "日本語 (Japanese)" },
  { value: "Chinese", label: "中文 (Chinese)" },
  { value: "Spanish", label: "Español (Spanish)" },
  { value: "Other", label: "Other (note in requests)" },
];

export const INTEREST_OPTIONS: { id: BookingInterestId; label: string }[] = [
  { id: "k_pop", label: "K-pop" },
  { id: "k_drama", label: "K-drama" },
  { id: "k_movie", label: "K-movie" },
  { id: "food", label: "Food" },
  { id: "shopping", label: "Shopping" },
  { id: "local_support", label: "Local support" },
];

export const SUPPORT_NEED_OPTIONS: { id: BookingSupportNeedId; label: string }[] = [
  { id: "transportation", label: "Transportation" },
  { id: "check_in", label: "Check-in help" },
  { id: "ordering", label: "Ordering help" },
  { id: "local_tips", label: "Local tips" },
  { id: "route_support", label: "Route support" },
  { id: "practical_guidance", label: "Practical city guidance" },
];

export const HANDOFF_CHANNEL_OPTIONS: {
  value: BookingHandoffChannel;
  label: string;
  hint: string;
}[] = [
  { value: "kakao", label: "KakaoTalk", hint: "ID search" },
  { value: "telegram", label: "Telegram", hint: "@username" },
  { value: "whatsapp", label: "WhatsApp", hint: "Number with country code" },
  { value: "email", label: "Email", hint: "Same as contact email or alternate" },
];

export const SERVICE_CODES: ServiceTypeCode[] = ["arrival", "k_route", "first_24h"];

export function emptyWizardState() {
  return {
    serviceCode: "arrival" as ServiceTypeCode,
    userType: "" as "" | "foreign_traveler" | "korean_traveler",
    regionSlug: "",
    date: "",
    time: "",
    travelerCount: 1,
    preferredLanguage: "",
    firstTimeKorea: null as boolean | null,
    meetingPoint: "",
    accommodationArea: "",
    interests: [] as BookingInterestId[],
    supportNeeds: [] as BookingSupportNeedId[],
    guestName: "",
    guestEmail: "",
    specialRequests: "",
    contactChannel: "kakao" as BookingHandoffChannel,
    contactHandle: "",
    agreedScope: false,
    agreedAdminReview: false,
    agreedNoImmediateChat: false,
  };
}

export type WizardFormState = ReturnType<typeof emptyWizardState>;
