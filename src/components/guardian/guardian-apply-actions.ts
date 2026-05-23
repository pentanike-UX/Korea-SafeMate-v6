"use server";

import { z } from "zod";
import { getServerSupabaseForUser, getSupabaseAuthUserIdOnly } from "@/lib/supabase/server-user";
import { createServiceRoleSupabase } from "@/lib/supabase/service-role";

const RESIDENCE_BUCKET = "guardian-docs";
const MAX_DOC_BYTES = 10 * 1024 * 1024;
const ALLOWED_DOC_TYPES: Record<string, string> = {
  "application/pdf": "pdf",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

const applySchema = z.object({
  realName: z.string().trim().min(1).max(120),
  displayName: z.string().trim().min(1).max(120),
  contactEmail: z.string().trim().email().max(254),
  languages: z.array(z.string().trim().min(1)).min(1).max(20),
  motivation: z.string().trim().min(10).max(4000),
  residenceProofPath: z.string().trim().max(512).optional(),
});

export interface UploadResidenceProofResult {
  ok: boolean;
  path?: string;
  needsLogin?: boolean;
  error?: string;
}

/** 거주 증빙 문서를 비공개 버킷에 service-role로 업로드하고 저장 경로를 반환. */
export async function uploadResidenceProofAction(formData: FormData): Promise<UploadResidenceProofResult> {
  const userId = await getSupabaseAuthUserIdOnly();
  if (!userId) return { ok: false, needsLogin: true };

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "파일을 선택해 주세요." };
  }
  if (file.size > MAX_DOC_BYTES) {
    return { ok: false, error: "파일 크기는 10MB 이하여야 합니다." };
  }
  const ext = ALLOWED_DOC_TYPES[file.type];
  if (!ext) {
    return { ok: false, error: "PDF·JPG·PNG·WEBP 형식만 업로드할 수 있습니다." };
  }

  const svc = createServiceRoleSupabase();
  if (!svc) {
    return { ok: false, error: "현재 문서 업로드를 사용할 수 없습니다. 나중에 다시 시도해 주세요." };
  }

  const path = `${userId}/residence-${Date.now()}.${ext}`;
  const { error } = await svc.storage
    .from(RESIDENCE_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: true });
  if (error) return { ok: false, error: error.message };

  return { ok: true, path };
}

export interface SubmitGuardianApplicationResult {
  ok: boolean;
  /** 미로그인 — 클라이언트가 로그인으로 유도. */
  needsLogin?: boolean;
  /** 이미 지원함(user_id unique). */
  alreadyApplied?: boolean;
  error?: string;
}

export async function submitGuardianApplicationAction(input: {
  realName: string;
  displayName: string;
  contactEmail: string;
  languages: string[];
  motivation: string;
  residenceProofPath?: string;
}): Promise<SubmitGuardianApplicationResult> {
  const userId = await getSupabaseAuthUserIdOnly();
  if (!userId) return { ok: false, needsLogin: true };

  const parsed = applySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "입력값을 확인해 주세요." };
  }

  const sb = await getServerSupabaseForUser();
  if (!sb) return { ok: false, needsLogin: true };

  // user_id unique — 기존 지원 확인
  const { data: existing } = await sb
    .from("guardian_applications")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  if (existing) return { ok: false, alreadyApplied: true };

  const { error } = await sb.from("guardian_applications").insert({
    user_id: userId,
    real_name: parsed.data.realName,
    display_name: parsed.data.displayName,
    contact_email: parsed.data.contactEmail,
    languages: parsed.data.languages,
    motivation: parsed.data.motivation,
    residence_proof: parsed.data.residenceProofPath ?? null,
  });
  if (error) {
    // 동시 제출 등으로 unique 위반 시
    if (error.code === "23505") return { ok: false, alreadyApplied: true };
    return { ok: false, error: error.message };
  }

  return { ok: true };
}
