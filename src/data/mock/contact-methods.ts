import type { ContactMethod } from "@/types/domain";

export const mockContactMethods: ContactMethod[] = [
  {
    id: "c1",
    user_id: "mg14",
    channel: "telegram",
    handle: "@hong_seoyeon_demo",
    is_preferred: true,
    verified: true,
  },
  {
    id: "c1b",
    user_id: "mg14",
    channel: "kakao",
    handle: "hong.seoyeon.demo",
    is_preferred: false,
    verified: true,
  },
  {
    id: "c1c",
    user_id: "mg14",
    channel: "whatsapp",
    handle: "+82-10-xxxx-xxxx",
    is_preferred: false,
    verified: false,
  },
  {
    id: "c1d",
    user_id: "mg14",
    channel: "email",
    handle: "guardian.seed.mg14@example.dev",
    is_preferred: false,
    verified: false,
  },
  {
    id: "c2",
    user_id: "mg12",
    channel: "kakao",
    handle: "oh.chaewon.demo",
    is_preferred: true,
    verified: false,
  },
];
